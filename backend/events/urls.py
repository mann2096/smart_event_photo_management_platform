from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (EventViewSet,ChangeEventRoleAPI,CreateEventInviteAPI,JoinEventAPI,EventParticipantsAPI,MyEventRoleAPI,)

router=DefaultRouter()
router.register("",EventViewSet,basename="events")

urlpatterns=[
    path("", include(router.urls)),
    path("<uuid:event_id>/roles/",ChangeEventRoleAPI.as_view()),
    path("<uuid:event_id>/invite/",CreateEventInviteAPI.as_view()),
    path("join/<uuid:invite_id>/",JoinEventAPI.as_view()),
    path("<uuid:event_id>/participants/",EventParticipantsAPI.as_view()),
    path("<uuid:event_id>/my-role/",MyEventRoleAPI.as_view()),
]
