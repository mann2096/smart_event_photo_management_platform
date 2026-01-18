from django.utils import timezone
from datetime import timedelta
import secrets
from django.contrib.auth.mixins import LoginRequiredMixin
import mimetypes
from django.views import View
from notifications.email import send_notification_email
from events.models import Event
from django.http import FileResponse, Http404
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from events.permissions import user_has_event_access
from notifications.utils import notify_user
from .tasks import apply_watermark,auto_tag_photo,extract_exif_data,generate_thumbnail
from .models import Photo,PhotoLike, PhotoShareLink, PhotoVersion, PhotoView
from .serializers import PhotoCommentSerializer, PhotoSerializer, PhotoShareLinkSerializer
from users.models import User,UserEvent,TaggedBy
from celery import chain
from rest_framework.response import Response
from users.models import Favourite
from .models import Comment
from django.db.models import F
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Sum
from django.db.models import Q
import uuid
from notifications.utils import build_notification_payload
from django.db.models.functions import Cast
from django.db.models import DateField
import os
from rest_framework.decorators import action

class BulkPhotoDeleteAPI(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        photo_ids = request.data.get("photo_ids", [])

        if not photo_ids:
            return Response(
                {"detail": "No photos selected"},
                status=400
            )
        photos = (
            Photo.objects
            .filter(id__in=photo_ids)
            .select_related("event", "uploaded_by")
        )
        if photos.count() != len(photo_ids):
            return Response(
                {"detail": "One or more photos not found"},
                status=404
            )
        unauthorized_photos = []
        for photo in photos:
            if user.is_superuser:
                continue

            try:
                user_event = UserEvent.objects.get(
                    user=user,
                    event=photo.event
                )
            except UserEvent.DoesNotExist:
                unauthorized_photos.append(photo.id)
                continue

            if user_event.role == "coordinator":
                continue

            if (
                user_event.role == "photographer"
                and photo.uploaded_by_id == user.id
            ):
                continue

            unauthorized_photos.append(photo.id)
        if unauthorized_photos:
            return Response(
                {
                    "detail": "You do not have permission to delete one or more selected photos",
                    "unauthorized_photo_ids": unauthorized_photos,
                },
                status=403
            )
        deleted_count = photos.count()
        photos.delete()

        return Response(
            {"deleted": deleted_count},
            status=200
        )


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
        return Response({"status":"retagged"},status=200)

class BulkPhotoUploadAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request):
        event_id=request.data.get("event")
        images=request.FILES.getlist("images")
        if not event_id or not images:
            return Response(
                {"detail":"Event and at least one image are required"},
                status=400,
            )
        event=get_object_or_404(Event, id=event_id)
        if not request.user.is_superuser:
            if not UserEvent.objects.filter(
                user=request.user,
                event=event,
                role__in=["photographer","coordinator"],
            ).exists():
                raise PermissionDenied("Not allowed to upload photos")
        photos=[]
        for image in images:
            photo=Photo.objects.create(
                event=event,
                image=image,
                uploaded_by=request.user,
            )
            photos.append(photo)
            chain(
                extract_exif_data.si(photo.id),
                generate_thumbnail.si(photo.id),
                apply_watermark.si(photo.id),
                auto_tag_photo.si(photo.id),
            ).delay()
        participants=(
            UserEvent.objects
            .filter(event=event)
            .select_related("user")
        )
        for ue in participants:
            if ue.user_id==request.user.id:
                continue
            notify_user(
                user_id=ue.user.id,
                payload=build_notification_payload(
                    type="bulk_upload",
                    actor=request.user,
                    event=event,
                    extra={
                        "photo_count":len(photos),
                    },
                ),
            )
            send_notification_email(
                to_email=ue.user.email,
                subject=f"New photos uploaded to {event.name}",
                message=(
                    f"{request.user.user_name} uploaded "
                    f"{len(photos)} new photos to the event "
                    f"'{event.name}'."
                ),
            )
        return Response(
            {"uploaded": len(photos)},
            status=201,
        )

class PhotoDetailAPI(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,photo_id):
        photo=get_object_or_404(Photo,id=photo_id)
        serializer=PhotoSerializer(
            photo,
            context={"request":request}
        )
        return Response(serializer.data)

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
            expires_at=timezone.now()+timedelta(hours=int(expires_in_hours))
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
        if not user_has_event_access(request.user,photo.event):
            return Response({"detail":"Access denied"},status=403)
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
                user_id=photo.uploaded_by.id,
                payload=build_notification_payload(
                    type="comment",
                    actor=request.user,
                    event=photo.event,
                    photo=photo,
                    extra={
                        "comment": comment.text,
                    },
                ),
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
                user_id=parent.user.id,
                payload=build_notification_payload(
                    type="reply",
                    actor=request.user,
                    event=photo.event,
                    photo=photo,
                    extra={
                        "comment": comment.text,
                    },
                ),
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
    permission_classes=[IsAuthenticated]
    def get(self,request,photo_id):
        photo=get_object_or_404(Photo,id=photo_id)
        if not (request.user.is_superuser or user_has_event_access(request.user, photo.event)):
            raise PermissionDenied("Access denied")
        comments=(
            Comment.objects
            .filter(photo=photo,parent__isnull=True)
            .select_related("user")
            .prefetch_related("replies__user")
            .order_by("created_at")
        )
        serializer=PhotoCommentSerializer(comments,many=True)
        return Response(serializer.data)

class TagUserOnPhotoAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,photo_id):
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
            defaults={"tagged_by":request.user}
        )
        if not created:
            return Response({"detail":"User already tagged"},status=400)
        if tagged_user!=request.user:
            notify_user(
                user_id=tagged_user.id,
                payload=build_notification_payload(
                    type="tagged",
                    actor=request.user,
                    event=photo.event,
                    photo=photo,
                ),
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
        taggings=(
            TaggedBy.objects
            .filter(tagged_user=request.user)
            .select_related(
                "tagged_user",
                "photo",
                "photo__event",
                "photo__uploaded_by",
            )
        )
        data=[
            {
                "photo":{
                    "id":tag.photo.id,
                    "image":tag.photo.image.url,
                    "uploaded_at":tag.photo.uploaded_at,
                    "views":tag.photo.views,
                    "exif_data":tag.photo.exif_data,
                    "event":{
                        "id":tag.photo.event.id,
                        "name":tag.photo.event.name,
                        "visibility":tag.photo.event.visibility,
                    },
                },
                "tagged_at":tag.created_at,
                "tagged_user":{  
                    "id":tag.tagged_user.id,        
                    "user_name":tag.tagged_user.user_name,
                    "email":tag.tagged_user.email,
                },
            }
            for tag in taggings
        ]
        return Response(data)
    
class PhotoFavouriteToggleAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,photo_id):
        photo=get_object_or_404(Photo,id=photo_id)
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
        photos=Photo.objects.filter(
            favourited_by__user=request.user
        ).select_related("event","uploaded_by")
        serializer=PhotoSerializer(
            photos,
            many=True,
            context={"request":request}
        )
        return Response(serializer.data)

class PhotoLikeToggleAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,photo_id):
        photo=get_object_or_404(Photo,id=photo_id)
        if not user_has_event_access(request.user, photo.event):
            raise PermissionDenied("Not allowed")
        like,created=PhotoLike.objects.get_or_create(
            user=request.user,
            photo=photo
        )
        if not created:
            like.delete()
            liked=False
        else:
            liked=True
            if photo.uploaded_by!=request.user:
                notify_user(
                    user_id=photo.uploaded_by.id,
                    payload=build_notification_payload(
                        type="photo_like",
                        actor=request.user,
                        event=photo.event,
                        photo=photo,
                    ),
                )
                send_notification_email(
                    to_email=photo.uploaded_by.email,
                    subject="Your photo got a new like",
                    message=(
                        f"{request.user.user_name} liked your photo "
                        f"in event '{photo.event.name}'."
                    ),
                )
        likes_count=PhotoLike.objects.filter(photo=photo).count()
        return Response({
            "liked":liked,
            "likes_count":likes_count
        })

class RecordPhotoViewAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,photo_id):
        photo=get_object_or_404(Photo,id=photo_id)
        view,created=PhotoView.objects.get_or_create(
            user=request.user,
            photo=photo
        )
        if created:
            Photo.objects.filter(id=photo_id).update(
                views=F("views")+1
            )
        return Response({"status":"ok"})

class PhotoViewSet(ModelViewSet):
    serializer_class=PhotoSerializer
    permission_classes=[IsAuthenticated]
    def get_serializer_context(self):
        context=super().get_serializer_context()
        context["request"]=self.request
        return context

    def _clean_uuid_list(self,values):
        cleaned=[]
        for v in values:
            try:
                cleaned.append(str(uuid.UUID(v)))
            except (ValueError,TypeError):
                continue
        return cleaned

    def get_queryset(self):
        user=self.request.user
        params=self.request.query_params
        queryset=Photo.objects.all()
        private_only=params.get("private_only")=="true"
        if private_only:
            queryset=queryset.filter(
                event__visibility="private",
                event__participants__user=user,
            )
        else:
            queryset=queryset.filter(
                Q(event__visibility="public") |
                Q(event__participants__user=user)
            )
        raw_ids=[]
        raw_ids+=params.getlist("event_ids[]")
        raw_ids+=params.getlist("event_ids")
        raw=params.get("event_ids")
        if raw:
            raw_ids+=raw.split(",")
        event_ids=self._clean_uuid_list(raw_ids)
        if event_ids:
            queryset=queryset.filter(event__id__in=event_ids)
        event_name=params.get("event_name")
        if event_name:
            queryset=queryset.filter(event__name__icontains=event_name)
        start_date=params.get("start_date")
        end_date=params.get("end_date")
        if start_date and end_date:
            queryset=queryset.annotate(
                event_start=Cast("event__start_date",DateField()),
                event_end=Cast("event__end_date",DateField()),
            ).filter(
                event_start__lte=end_date,
                event_end__gte=start_date,
            )
        tags=params.getlist("tags")
        if tags:
            queryset=queryset.filter(photo_tags__tag__name__in=tags).distinct()
        if params.get("timeline")=="true":
            queryset=queryset.order_by(
                F("taken_at").asc(nulls_last=True),
                F("uploaded_at").asc(nulls_last=True),
            )
        return queryset.distinct()
    
    @action(detail=True, methods=["get"], url_path="download")
    def download_watermarked(self, request, pk=None):
        photo = self.get_object()

        if not (
            request.user.is_superuser
            or user_has_event_access(request.user, photo.event)
        ):
            raise PermissionDenied("Access denied")

        try:
            version = PhotoVersion.objects.get(
                photo=photo,
                resolution="original",
                is_watermarked=True,
            )
        except PhotoVersion.DoesNotExist:
            raise Http404("Watermarked version not available")

        path = version.image.path
        if not os.path.exists(path):
            raise Http404("File missing")

        content_type, _ = mimetypes.guess_type(path)
        content_type = content_type or "application/octet-stream"

        return FileResponse(
            open(path, "rb"),
            as_attachment=True,
            filename=os.path.basename(path),
            content_type=content_type,
        )
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

        participants=UserEvent.objects.filter(event=event).select_related("user")
        for ue in participants:
            if ue.user!=user:
                send_notification_email(
                    to_email=ue.user.email,
                    subject=f"New photos uploaded in {event.name}",
                    message=(
                        f"{user.user_name} uploaded new photos "
                        f"to the event '{event.name}'."
                    )
                )
        serializer.save(uploaded_by=user)

class PhotographerDashboardAPI(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        try:
            user=request.user
            photos=Photo.objects.filter(uploaded_by=user).exclude(uploaded_by__isnull=True)
            total_uploads=photos.count()
            total_views=photos.aggregate(total=Sum("views"))["total"] or 0
            total_downloads=photos.aggregate(total=Sum("downloads"))["total"] or 0
            total_likes=PhotoLike.objects.filter(photo__uploaded_by=user).count()
            events_data=[]
            events=Event.objects.filter(photos__uploaded_by=user).distinct()
            for event in events:
                event_photos=photos.filter(event=event)
                events_data.append({
                    "event_id":event.id,
                    "event_name":event.name,
                    "photo_count":event_photos.count(),
                    "views":event_photos.aggregate(v=Sum("views"))["v"] or 0,
                    "downloads":event_photos.aggregate(d=Sum("downloads"))["d"] or 0,
                    "likes":PhotoLike.objects.filter(photo__in=event_photos).count(),})
            return Response({
                "total_uploads":total_uploads,
                "total_views":total_views,
                "total_likes":total_likes,
                "total_downloads":total_downloads,
                "events":events_data,
            })
        except Exception as e:
            print("DASHBOARD ERROR:",repr(e))
            raise
