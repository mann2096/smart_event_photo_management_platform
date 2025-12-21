from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .models import Event
from .serializers import EventSerializer
from .permissions import CanCreateEvent
from users.models import UserEvent

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
