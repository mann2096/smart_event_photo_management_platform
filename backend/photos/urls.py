from django.urls import path
from .views import PhotoViewSet

photo_list = PhotoViewSet.as_view({
    "get":"list",
    "post":"create",
})

photo_detail = PhotoViewSet.as_view({
    "get":"retrieve",
    "delete":"destroy",
})

urlpatterns = [
    path("",photo_list,name="photo-list"),
    path("<uuid:pk>/",photo_detail,name="photo-detail"),
]
