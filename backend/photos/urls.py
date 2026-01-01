from django.urls import path
from .views import PhotoViewSet
from .views import *

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
    path("<uuid:photo_id>/",PhotoDetailAPI.as_view(),name="photo-detail"),
    path("<uuid:photo_id>/like/",PhotoLikeToggleAPI.as_view()),
    path("<uuid:photo_id>/favourite/",PhotoFavouriteToggleAPI.as_view()),
    path("<uuid:photo_id>/download/",PhotoDownloadAPI.as_view()),
    path("<uuid:photo_id>/comment/",AddCommentAPI.as_view()),
    path("<uuid:photo_id>/comments/",PhotoCommentsAPI.as_view()),
    path("<uuid:photo_id>/tag/",TagUserOnPhotoAPI.as_view()),
    path("favourites/",MyFavouritesAPI.as_view()),
    path("tagged/",MyTaggedPhotosAPI.as_view()),
    path("bulk/",BulkPhotoUploadAPI.as_view()),
    path("bulk-delete/",BulkPhotoDeleteAPI.as_view()),
    path("bulk-retag/",BulkPhotoRetagAPI.as_view()),
    path("dashboard/",PhotographerDashboardAPI.as_view()),
    path("<uuid:photo_id>/share/",CreatePhotoShareLinkAPI.as_view()),
    path("share/<str:token>/",PublicPhotoShareView.as_view()),
]
