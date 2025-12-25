from urllib import response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .models import Event
from .serializers import EventSerializer
from .permissions import CanCreateEvent
from users.models import UserEvent
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404

class EventViewSet(ModelViewSet):
    serializer_class=EventSerializer
    permission_classes=[IsAuthenticated]
    def get_queryset(self):
        user=self.request.user
        if user.is_superuser:
            return Event.objects.all()
        public_events=Event.objects.filter(visibility="public")
        member_events=Event.objects.filter(participants__user=user)
        return (public_events|member_events).distinct()

    def perform_create(self,serializer):
        event=serializer.save(created_by=self.request.user)
        UserEvent.objects.create(user=self.request.user,event=event,role="coordinator",)

class ChangeEventRoleAPI(APIView):
    permission_classes=[IsAuthenticated]
    def patch(self,request,event_id):
        event=get_object_or_404(Event,id=event_id)
        if not UserEvent.objects.filter(
            user=request.user,
            event=event,
            role="coordinator"
        ).exists():
            raise PermissionDenied("Only coordinators can change roles")
        user_id=request.data["user_id"]
        role=request.data["role"]
        ue=get_object_or_404(UserEvent,user_id=user_id, event=event)
        ue.role=role
        ue.save()
        return response({"status":"role updated"})