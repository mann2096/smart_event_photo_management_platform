from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .models import Event
from .serializers import EventSerializer
from .permissions import CanCreateEvent

class EventViewSet(ModelViewSet):
    queryset=Event.objects.all()
    serializer_class=EventSerializer
    permission_classes=[IsAuthenticated,CanCreateEvent]
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
