from events.models import Event
from django.http import Http404
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from events.permissions import user_has_event_access
from notifications.utils import notify_user
from .tasks import apply_watermark,auto_tag_photo,extract_exif_data,generate_thumbnail
from .models import Photo,PhotoLike
from .serializers import PhotoSerializer
from users.models import User,UserEvent,TaggedBy
from celery import chain
from rest_framework.response import Response
from users.models import Favourite
from .models import Comment
from django.db.models import F
from django.shortcuts import get_object_or_404

class BulkPhotoUploadAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request):
        event_id=request.data["event"]
        images=request.FILES.getlist("images")
        event=get_object_or_404(Event,id=event_id)
        if not UserEvent.objects.filter(
            user=request.user,
            event=event,
            role__in=["photographer","coordinator"]
        ).exists():
            raise PermissionDenied("Not allowed")
        for image in images:
            photo=Photo.objects.create(
                event=event,
                image=image,
                uploaded_by=request.user
            )
            chain(
                extract_exif_data.s(photo.id),
                generate_thumbnail.s(),
                apply_watermark.s(),
                auto_tag_photo.s(),
            ).delay()
        return Response({"uploaded": len(images)}, status=201)


class PhotoDetailAPI(APIView):
    def get(self,request,photo_id):
        Photo.objects.filter(id=photo_id).update(views=F("views")+1)
        photo=Photo.objects.get(id=photo_id)
        return Response({"image":photo.image.url})

class PhotoDownloadAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self, request, photo_id):
        Photo.objects.filter(id=photo_id).update(downloads=F("downloads")+1)
        photo=Photo.objects.get(id=photo_id)
        return Response({"download_url":photo.image.url})


class AddCommentAPI(APIView):
    permission_classes=[IsAuthenticated]

    def post(self,request,photo_id):
        try:
            photo=Photo.objects.get(id=photo_id)
        except Photo.DoesNotExist:
            raise Http404("Photo not found")
        if not user_has_event_access(request.user, photo.event):
            return Response({"detail": "Access denied"}, status=403)

        parent_id=request.data.get("parent_id")
        parent=None
        if parent_id:
            try:
                parent=Comment.objects.get(id=parent_id, photo=photo)
            except Comment.DoesNotExist:
                raise Http404("Parent comment not found")

        comment=Comment.objects.create(
            photo=photo,
            user=request.user,
            text=request.data["text"],
            parent=parent
        )
        if parent is None and photo.uploaded_by!=request.user:
            notify_user(
                photo.uploaded_by.id,
                {
                    "type":"comment",
                    "photo_id":str(photo.id),
                    "comment":comment.text,
                }
            )
        if parent is not None and parent.user!=request.user:
            notify_user(
                parent.user.id,
                {
                    "type":"reply",
                    "photo_id":str(photo.id),
                    "comment":comment.text,
                }
            )
        return Response(
            {
                "id":comment.id,
                "created_at":comment.created_at,
            },
            status=201
        )


class PhotoCommentsAPI(APIView):
    def get(self,request,photo_id):
        comments=Comment.objects.filter(photo_id=photo_id,parent__isnull=True).prefetch_related("replies")

        def serialize_comment(c):
            return {
                "id":c.id,
                "text":c.text,
                "user":c.user.email,
                "created_at": c.created_at,
                "replies":[serialize_comment(r) for r in c.replies.all()]
            }

        return Response([serialize_comment(c) for c in comments])


class TagUserOnPhotoAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self, request, photo_id):
        try:
            photo=Photo.objects.get(id=photo_id)
        except Photo.DoesNotExist:
            raise Http404("Photo not found")
        if not user_has_event_access(request.user, photo.event):
            return Response({"detail":"Access denied"},status=403)

        tagged_user_id=request.data.get("user_id")
        if not tagged_user_id:
            return Response({"detail":"user_id required"}, status=400)
        try:
            tagged_user=User.objects.get(id=tagged_user_id)
        except User.DoesNotExist:
            raise Http404("User not found")
        tag,created=TaggedBy.objects.get_or_create(
            tagged_user=tagged_user,
            photo=photo,
            defaults={"tagged_by": request.user}
        )
        if not created:
            return Response({"detail": "User already tagged"},status=400)
        if tagged_user!=request.user:
            notify_user(
                tagged_user.id,
                {
                    "type":"tagged",
                    "photo_id":str(photo.id),
                    "tagged_by":request.user.user_name,
                }
            )

        return Response(
            {
                "photo_id":photo.id,
                "tagged_user":tagged_user.id,
                "tagged_at":tag.created_at,
            },
            status=201
        )


class MyTaggedPhotosAPI(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        taggings=(TaggedBy.objects.filter(tagged_user=request.user).select_related("photo"))
        data=[
            {
                "id":tag.photo.id,
                "image":tag.photo.image.url,
                "tagged_at": tag.created_at,
            }
            for tag in taggings
        ]

        return Response(data)


class PhotoFavouriteToggleAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,photo_id):
        try:
            photo=Photo.objects.get(id=photo_id)
        except Photo.DoesNotExist:
            raise Http404("Not found")
        fav,created=Favourite.objects.get_or_create(user=request.user,photo=photo)
        if not created:
            fav.delete()
            return Response({"favourited":False})
        return Response({"favourited":True})

class MyFavouritesAPI(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        photos=Photo.objects.filter(favourited_by__user=request.user).distinct()
        data=[{"id":p.id,"image":p.image.url} for p in photos]
        return Response(data)


class PhotoLikeToggleAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,photo_id):
        try:
            photo=Photo.objects.get(id=photo_id)
        except Photo.DoesNotExist:
            raise Http404("Not found")
        like,created=PhotoLike.objects.get_or_create(
            user=request.user,
            photo=photo
        )
        if not created:
            like.delete()
            return Response({"liked":False})
        if photo.uploaded_by!=request.user:
            notify_user(photo.uploaded_by.id,
                {
                    "type":"photo_like",
                    "photo_id":str(photo.id),
                    "liked_by":request.user.user_name,
                }
            )

        return Response({"liked":True})

class PhotoViewSet(ModelViewSet):
    queryset=Photo.objects.all()
    serializer_class=PhotoSerializer
    permission_classes=[IsAuthenticated]
    def get_queryset(self):
        queryset=super().get_queryset()
        event_id=self.request.query_params.get("event")
        photographer_id=self.request.query_params.get("photographer")
        date=self.request.query_params.get("date")
        if event_id:
            queryset=queryset.filter(event_id=event_id)
        if photographer_id:
            queryset=queryset.filter(uploaded_by_id=photographer_id)
        if date:
            queryset=queryset.filter(uploaded_at__date=date)
        return queryset

    def perform_create(self, serializer):
        event = serializer.validated_data["event"]
        user = self.request.user

        if not user.is_superuser:
            if not UserEvent.objects.filter(
                user=user,
                event=event,
                role__in=["photographer", "coordinator"]
            ).exists():
                raise PermissionDenied("Not a photographer for this event")

        photo = serializer.save(uploaded_by=user)

        chain(
            extract_exif_data.s(photo.id),
            generate_thumbnail.s(),
            apply_watermark.s(),
            auto_tag_photo.s(),
        ).delay()

