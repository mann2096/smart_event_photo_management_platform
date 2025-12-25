from rest_framework.permissions import BasePermission
from users.models import UserEvent

class CanCreateEvent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

def user_has_event_access(user,event):
    if event.visibility=="public":
        return True
    return UserEvent.objects.filter(user=user,event=event).exists()

