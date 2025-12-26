from rest_framework.permissions import BasePermission
from users.models import UserEvent

def user_has_event_access(user,event):
    if event.visibility=="public":
        return True
    if user.is_superuser:
            return True
    return UserEvent.objects.filter(user=user,event=event).exists()

class CanUpdateEvent(BasePermission):
    def has_object_permission(self,request,view,obj):
        user=request.user
        if user.is_superuser:
            return True
        return UserEvent.objects.filter(
            user=user,
            event=obj,
            role="coordinator"
        ).exists()