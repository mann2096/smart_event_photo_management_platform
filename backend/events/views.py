from datetime import timezone
from urllib import response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from events.permissions import CanUpdateEvent
from .models import Event, EventInvite
from .serializers import EventSerializer
from users.models import UserEvent
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.conf import settings
from rest_framework.response import Response

class EventViewSet(ModelViewSet):
    serializer_class=EventSerializer
    permission_classes=[IsAuthenticated]
    def get_queryset(self):
        user=self.request.user
        if user.is_superuser:
            return Event.objects.all()
        public_events=Event.objects.filter(visibility="public")
        member_events=Event.objects.filter(participants__user=user)
        return(public_events|member_events).distinct()

    def get_permissions(self):
        if self.action in ["update","partial_update","destroy"]:
            return [IsAuthenticated(),CanUpdateEvent()]
        return super().get_permissions()

    def perform_create(self,serializer):
        event=serializer.save(created_by=self.request.user)
        UserEvent.objects.create(user=self.request.user,event=event,role="coordinator",)

class ChangeEventRoleAPI(APIView):
    permission_classes=[IsAuthenticated]
    def patch(self,request,event_id):
        event=get_object_or_404(Event,id=event_id)
        user=request.use
        if not (
            user.is_superuser or
            UserEvent.objects.filter(
            user=request.user,
            event=event,
            role="coordinator"
        ).exists()
        ):
            raise PermissionDenied("Only coordinators can change roles")
        user_id=request.data["user_id"]
        role=request.data["role"]
        ue=get_object_or_404(UserEvent,user_id=user_id, event=event)
        ue.role=role
        ue.save()
        return Response({"status":"role updated"})

class CreateEventInviteAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,event_id):
        event=Event.objects.get(id=event_id)
        user=request.use
        if not (
            user.is_superuser or
            UserEvent.objects.filter(
            user=request.user,
            event=event,
            role="coordinator"
        ).exists()
        ):
            raise PermissionDenied("Only coordinators can create invites")
        invite=EventInvite.objects.create(
            event=event,
            created_by=request.user
        )
        return Response({
            "invite_link": f"{settings.FRONTEND_BASE_URL}/join-event/{invite.id}"
        })
    
class JoinEventAPI(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request,invite_id):
        invite=EventInvite.objects.filter(id=invite_id, is_active=True).first()
        if not invite:
            return Response({"detail":"Invalid invite"},status=400)
        if invite.expires_at and invite.expires_at<timezone.now():
            return Response({"detail": "Invite expired"},status=400)
        UserEvent.objects.get_or_create(
            user=request.user,
            event=invite.event,
            defaults={"role":"member"}
        )
        return Response({"status":"joined","event_id":invite.event.id})
    
