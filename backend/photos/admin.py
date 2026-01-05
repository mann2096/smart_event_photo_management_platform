from django.contrib import admin
from .models import (
    Photo,
    PhotoVersion,
    Tag,
    PhotoTag,
    Comment,
    PhotoLike,
    PhotoShareLink,
    PhotoView,
)

@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ("id", "event", "uploaded_by", "uploaded_at", "views")
    list_filter = ("event", "uploaded_by")
    search_fields = ("event__name", "uploaded_by__email")


admin.site.register(PhotoVersion)
admin.site.register(Tag)
admin.site.register(PhotoTag)
admin.site.register(Comment)
admin.site.register(PhotoLike)
admin.site.register(PhotoShareLink)
admin.site.register(PhotoView)
