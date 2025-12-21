from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import Photo
from .serializers import PhotoSerializer
from users.models import UserEvent

class PhotoViewSet(ModelViewSet):
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

    def perform_create(self,serializer):
        event=serializer.validated_data["event"]
        user=self.request.user
        if user.is_superuser:
            serializer.save(uploaded_by=user)
            return
        if not UserEvent.objects.filter(user=user,event=event,role="photographer").exists():
            raise PermissionDenied("Not a photographer for this event")

        serializer.save(uploaded_by=user)
