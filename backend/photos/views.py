from datetime import timezone
import secrets
from notifications.email import send_notification_email
from photos.permissions import CanDeletePhoto
from events import models
from events.models import Event
from django.http import Http404
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from events.permissions import user_has_event_access
from notifications.utils import notify_user
from .tasks import apply_watermark,auto_tag_photo,extract_exif_data,generate_thumbnail
from .models import Photo,PhotoLike, PhotoShareLink, PhotoVersion
from .serializers import PhotoSerializer, PhotoShareLinkSerializer
from users.models import User,UserEvent,TaggedBy
from celery import chain
from rest_framework.response import Response
from users.models import Favourite
from .models import Comment
from django.db.models import F
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Sum,Count
from django.db.models import Q

class BulkPhotoDeleteAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request):
        photo_ids=request.data.get("photo_ids")
        if not photo_ids:
            return Response({"detail":"photo_ids required"},status=400)
        photos=Photo.objects.filter(id__in=photo_ids)
        if not photos.exists():
            return Response({"detail":"No photos found"},status=404)
        with transaction.atomic():
            for photo in photos:
                if not request.user.is_superuser:
                    if not UserEvent.objects.filter(
                        user=request.user,
                        event=photo.event,
                        role__in=["photographer","coordinator"]
                    ).exists():
                        raise PermissionDenied("Not allowed to delete one or more photos")
            deleted_count=photos.count()
            photos.delete()
        return Response({"deleted": deleted_count},status=200)

class BulkPhotoRetagAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request):
        photo_ids=request.data.get("photo_ids")
        user_ids=request.data.get("user_ids")
        if not photo_ids or not user_ids:
            return Response(
                {"detail": "photo_ids and user_ids required"},
                status=400
            )
        photos=Photo.objects.filter(id__in=photo_ids)
        users=User.objects.filter(id__in=user_ids)
        if not photos.exists():
            return Response({"detail":"No photos found"},status=404)
        with transaction.atomic():
            for photo in photos:
                if not request.user.is_superuser:
                    if not UserEvent.objects.filter(
                        user=request.user,
                        event=photo.event,
                        role__in=["photographer","coordinator"]
                    ).exists():
                        raise PermissionDenied("Not allowed to retag one or more photos")
                TaggedBy.objects.filter(photo=photo).delete()
                for user in users:
                    TaggedBy.objects.create(
                        photo=photo,
                        tagged_user=user,
                        tagged_by=request.user
                    )
        return Response({"status":"retagged"}, status=200)

class BulkPhotoUploadAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request):
        event_id=request.data["event"]
        images=request.FILES.getlist("images")
        event=get_object_or_404(Event,id=event_id)
        if not request.user.is_superuser:
                if not UserEvent.objects.filter(
                    user=request.user,
                    event=event,
                    role__in=["photographer","coordinator"]
                ).exists():
                    raise PermissionDenied("Not allowed to upload photos to this event")
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
        return Response({"uploaded":len(images)},status=201)


class PhotoDetailAPI(APIView):
    def get(self,request,photo_id):
        Photo.objects.filter(id=photo_id).update(views=F("views")+1)
        photo=Photo.objects.get(id=photo_id)
        return Response({"image":photo.image.url})

class PhotoDownloadAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,photo_id):
        photo=get_object_or_404(Photo,id=photo_id)
        if not (
            request.user.is_superuser or
            user_has_event_access(request.user,photo.event)
        ):
            raise PermissionDenied("You are not allowed to download this photo")
        variant=request.query_params.get("variant","original")
        Photo.objects.filter(id=photo_id).update(downloads=F("downloads")+1)
        if variant=="original":
            return Response({"url":photo.image.url})
        version=get_object_or_404(
            PhotoVersion,
            photo=photo,
            resolution=variant
        )
        return Response({"url":version.image.url})

class CreatePhotoShareLinkAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,photo_id):
        photo=get_object_or_404(Photo,id=photo_id)
        user=request.user
        if not(
            user.is_superuser or
            request.user==photo.uploaded_by or
            UserEvent.objects.filter(
                user=request.user,
                event=photo.event,
                role="coordinator"
            ).exists()
        ):
            raise PermissionDenied("Not allowed")
        expires_in_hours=request.data.get("expires_in_hours")
        expires_at=None
        if expires_in_hours:
            expires_at=timezone.now()+timezone.timedelta(
                hours=int(expires_in_hours)
            )
        link=PhotoShareLink.objects.create(
            photo=photo,
            token=secrets.token_urlsafe(32),
            expires_at=expires_at,
            allow_download=request.data.get("allow_download",True)
        )
        serializer=PhotoShareLinkSerializer(
            link,
            context={"request":request}
        )
        return Response(serializer.data,status=201)

class PublicPhotoShareView(APIView):
    permission_classes=[]
    def get(self,request,token):
        link=get_object_or_404(PhotoShareLink,token=token)
        if link.is_expired():
            return Response({"detail": "Link expired"},status=410)
        photo=link.photo
        data={
            "image":photo.image.url,
            "event":photo.event.name,
            "taken_at":photo.taken_at,
        }
        if link.allow_download:
            data["download_url"]=photo.image.url
        return Response(data)


class AddCommentAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,photo_id):
        try:
            photo=Photo.objects.get(id=photo_id)
        except Photo.DoesNotExist:
            raise Http404("Photo not found")
        if not user_has_event_access(request.user, photo.event):
            return Response({"detail":"Access denied"}, status=403)

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
            send_notification_email(
                to_email=photo.uploaded_by.email,
                subject="New comment on your photo",
                message=(
                    f"{request.user.user_name} commented on your photo "
                    f"in event '{photo.event.name}'.\n\n"
                    f"Comment: {comment.text}"
                )
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
            send_notification_email(
                to_email=parent.user.email,
                subject="New reply to your comment",
                message=(
                    f"{request.user.user_name} replied to your comment "
                    f"on a photo in event '{photo.event.name}'.\n\n"
                    f"Reply: {comment.text}"
                )
            )
        return Response(
            {
                "id":comment.id,
                "created_at":comment.created_at,
            },
            status=201
        )


class PhotoCommentsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, photo_id):
        photo = get_object_or_404(Photo, id=photo_id)

        if not (
            request.user.is_superuser or
            user_has_event_access(request.user, photo.event)
        ):
            raise PermissionDenied("Access denied")

        comments = Comment.objects.filter(
            photo=photo,
            parent__isnull=True
        ).prefetch_related("replies")

        def serialize_comment(c):
            return {
                "id": c.id,
                "text": c.text,
                "user": c.user.email,
                "created_at": c.created_at,
                "replies": [serialize_comment(r) for r in c.replies.all()]
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
            send_notification_email(
                to_email=tagged_user.email,
                subject="You were tagged in a photo",
                message=(
                    f"You were tagged in a photo from event "
                    f"'{photo.event.name}'."
                )
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
    permission_classes=[IsAuthenticated]
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
        photo=get_object_or_404(Photo, id=photo_id)
        if not user_has_event_access(request.user, photo.event):
            raise PermissionDenied("Not allowed")
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
        photo=get_object_or_404(Photo,id=photo_id)
        if not user_has_event_access(request.user,photo.event):
            raise PermissionDenied("Not allowed")
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
        if photo.uploaded_by and photo.uploaded_by != request.user:
            send_notification_email(
                to_email=photo.uploaded_by.email,
                subject="Your photo got a new like",
                message=(
                    f"{request.user.user_name} liked your photo "
                    f"in event '{photo.event.name}'."
                )
            )
        return Response({"liked":True})

class PhotoViewSet(ModelViewSet):
    serializer_class=PhotoSerializer
    permission_classes=[IsAuthenticated]
    def get_queryset(self):
        user=self.request.user
        if user.is_superuser:
            queryset=Photo.objects.all()
        else:
            queryset=Photo.objects.filter(
                models.Q(event__visibility="public")|
                models.Q(event__participants__user=user)
            ).distinct()
        event_id=self.request.query_params.get("event")
        photographer_id=self.request.query_params.get("photographer")
        date=self.request.query_params.get("date")
        timeline=self.request.query_params.get("timeline")
        if timeline=="true":
            queryset=queryset.order_by("taken_at","uploaded_at")
        if event_id:
            queryset=queryset.filter(event_id=event_id)
        event_name=self.request.query_params.get("event_name")
        if event_name:
            queryset=queryset.filter(event__name__icontains=event_name)
        if photographer_id:
            queryset=queryset.filter(uploaded_by_id=photographer_id)
        if date:
            queryset=queryset.filter(uploaded_at__date=date)
        start_date=self.request.query_params.get("start_date")
        end_date=self.request.query_params.get("end_date")
        if start_date and end_date:
            queryset=queryset.filter(
                taken_at__date__range=[start_date, end_date]
            )
        tags=self.request.query_params.getlist("tags")
        if tags:
            queryset=queryset.filter(tags__tag__name__in=tags).distinct()
        return queryset

    def get_permissions(self):
        if self.action=="destroy":
            return [IsAuthenticated(),CanDeletePhoto()]
        return super().get_permissions()

    def perform_create(self,serializer):
        event=serializer.validated_data["event"]
        user=self.request.user
        if not user.is_superuser:
            if not UserEvent.objects.filter(
                user=user,
                event=event,
                role__in=["photographer","coordinator"]
            ).exists():
                raise PermissionDenied("Not a photographer for this event")
        photo=serializer.save(uploaded_by=user)
        participants = UserEvent.objects.filter(
            event=event
        ).select_related("user")
        for ue in participants:
            if ue.user != user:
                send_notification_email(
                    to_email=ue.user.email,
                    subject=f"New photos uploaded in {event.name}",
                    message=(
                        f"{user.user_name} uploaded new photos "
                        f"to the event '{event.name}'."
                    )
                )
        chain(
            extract_exif_data.s(photo.id),
            generate_thumbnail.s(),
            apply_watermark.s(),
            auto_tag_photo.s(),
        ).delay()

class PhotographerDashboardAPI(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        user=request.user
        photos=Photo.objects.filter(uploaded_by=user)
        total_uploads=photos.count()
        total_views=photos.aggregate(total=Sum("views"))["total"] or 0
        total_downloads=photos.aggregate(total=Sum("downloads"))["total"] or 0
        total_likes=PhotoLike.objects.filter(
            photo__uploaded_by=user
        ).count()
        events_data=[]
        events=Event.objects.filter(photo__uploaded_by=user).distinct()
        for event in events:
            event_photos=photos.filter(event=event)
            events_data.append({
                "event_id": event.id,
                "event_name": event.name,
                "photo_count": event_photos.count(),
                "views": event_photos.aggregate(v=Sum("views"))["v"] or 0,
                "downloads": event_photos.aggregate(d=Sum("downloads"))["d"] or 0,
                "likes": PhotoLike.objects.filter(
                    photo__in=event_photos
                ).count(),
            })
        return Response({
            "total_uploads":total_uploads,
            "total_views":total_views,
            "total_likes":total_likes,
            "total_downloads":total_downloads,
            "events":events_data,
        })
