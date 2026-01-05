from django.urls import path
from .views import NotificationListAPI, MarkNotificationReadAPI

urlpatterns=[
    path("",NotificationListAPI.as_view()),
    path("<uuid:notification_id>/read/",MarkNotificationReadAPI.as_view()),
]
