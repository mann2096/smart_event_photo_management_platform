from rest_framework import serializers
from .models import Photo

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
