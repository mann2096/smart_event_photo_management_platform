from rest_framework.permissions import BasePermission

class CanCreateEvent(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm("events.create_event")
