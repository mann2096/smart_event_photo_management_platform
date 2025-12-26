from rest_framework.permissions import BasePermission
from users.models import UserEvent

class CanDeletePhoto(BasePermission):
    def has_object_permission(self, request,view, obj):
        user=request.user
        if not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        if obj.uploaded_by==user:
            return True
        return UserEvent.objects.filter(
            user=user,
            event=obj.event,
            role="coordinator"
        ).exists()
