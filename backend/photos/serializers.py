from rest_framework import serializers
from .models import Photo, PhotoShareLink
from users.models import User

class PhotoUploaderSerializer(serializers.ModelSerializer):
    class Meta:
        model=User
        fields=["id","user_name","email"]

class PhotoSerializer(serializers.ModelSerializer):
    event=serializers.SerializerMethodField()
    uploaded_by=PhotoUploaderSerializer(read_only=True)
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

    def get_event(self, obj):
        return {
            "id":str(obj.event.id),
            "name":obj.event.name,
            "visibility":obj.event.visibility,
        }

class PhotoShareLinkSerializer(serializers.ModelSerializer):
    share_url=serializers.SerializerMethodField()
    class Meta:
        model=PhotoShareLink
        fields=[
            "id",
            "share_url",
            "expires_at",
            "allow_download",
        ]

    def get_share_url(self,obj):
        request=self.context.get("request")
        return request.build_absolute_uri(
            f"/api/photos/share/{obj.token}/"
        )
