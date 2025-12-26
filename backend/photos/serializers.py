from rest_framework import serializers
from .models import Photo, PhotoShareLink

class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model=Photo
        fields=[
            "id",
            "event",
            "image",
            "uploaded_by",
            "uploaded_at",
            "exif_data",
            "views",
        ]
        read_only_fields=[
            "id",
            "uploaded_by",
            "uploaded_at",
            "exif_data",
            "views",
        ]

class PhotoShareLinkSerializer(serializers.ModelSerializer):
    share_url=serializers.SerializerMethodField()
    class Meta:
        model=PhotoShareLink
        fields=["id","share_url","expires_at","allow_download"]
    def get_share_url(self,obj):
        request=self.context.get("request")
        return request.build_absolute_uri(f"/api/photos/share/{obj.token}/")
