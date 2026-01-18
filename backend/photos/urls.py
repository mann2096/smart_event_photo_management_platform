from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PhotoViewSet,
    PhotoLikeToggleAPI,
    PhotoFavouriteToggleAPI,
    AddCommentAPI,
    PhotoCommentsAPI,
    TagUserOnPhotoAPI,
    MyFavouritesAPI,
    MyTaggedPhotosAPI,
    BulkPhotoUploadAPI,
    BulkPhotoDeleteAPI,
    BulkPhotoRetagAPI,
    PhotographerDashboardAPI,
    CreatePhotoShareLinkAPI,
    PublicPhotoShareView,
    RecordPhotoViewAPI,
)
router = DefaultRouter()
router.register("", PhotoViewSet, basename="photos")

urlpatterns = [
    path("", include(router.urls)),
    path("<uuid:photo_id>/like/", PhotoLikeToggleAPI.as_view()),
    path("<uuid:photo_id>/favourite/", PhotoFavouriteToggleAPI.as_view()),
    path("<uuid:photo_id>/comment/", AddCommentAPI.as_view()),
    path("<uuid:photo_id>/comments/", PhotoCommentsAPI.as_view()),
    path("<uuid:photo_id>/tag/", TagUserOnPhotoAPI.as_view()),
    path("<uuid:photo_id>/view/", RecordPhotoViewAPI.as_view()),
    path("favourites/", MyFavouritesAPI.as_view()),
    path("tagged/", MyTaggedPhotosAPI.as_view()),
    path("bulk/", BulkPhotoUploadAPI.as_view()),
    path("bulk-delete/", BulkPhotoDeleteAPI.as_view()),
    path("bulk-retag/", BulkPhotoRetagAPI.as_view()),
    path("dashboard/", PhotographerDashboardAPI.as_view()),
    path("<uuid:photo_id>/share/", CreatePhotoShareLinkAPI.as_view()),
    path("share/<str:token>/", PublicPhotoShareView.as_view()),
]
