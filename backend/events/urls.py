from django.urls import path
from .views import ChangeEventRoleAPI, CreateEventInviteAPI, EventViewSet, JoinEventAPI

event_list=EventViewSet.as_view({
    "get":"list",
    "post":"create",
})

event_detail=EventViewSet.as_view({
    "get":"retrieve",
    "put":"update",
    "patch":"partial_update",
    "delete":"destroy",
})

urlpatterns = [
    path("",event_list,name="event-list"),
    path("<uuid:pk>/",event_detail,name="event-detail"),
    path("<uuid:event_id>/roles/",ChangeEventRoleAPI.as_view()),
    path("<uuid:event_id>/invite/", CreateEventInviteAPI.as_view()),
    path("join/<uuid:invite_id>/", JoinEventAPI.as_view()),
]
