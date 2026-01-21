from rest_framework import serializers
from .models import Photo,PhotoLike,PhotoShareLink,Comment
from users.models import User

class PhotoUploaderSerializer(serializers.ModelSerializer):
    class Meta:
        model=User
        fields=["id","user_name","email"]

class PhotoSerializer(serializers.ModelSerializer):
    event=serializers.SerializerMethodField()
    uploaded_by=PhotoUploaderSerializer(read_only=True)
    favourited_by_me=serializers.SerializerMethodField()
    likes_count=serializers.SerializerMethodField()
    liked_by_me=serializers.SerializerMethodField()
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
            "likes_count",
            "liked_by_me",
            "favourited_by_me",
            "exif_data",      
            "taken_at", 
        ]
    def get_favourited_by_me(self,obj):
        request=self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.favourited_by.filter(id=request.user.id).exists()
    def get_event(self,obj):
        return{
            "id":str(obj.event.id),
            "name":obj.event.name,
            "visibility":obj.event.visibility,
        }
    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_liked_by_me(self, obj):
        request=self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return PhotoLike.objects.filter(
            photo=obj,
            user=request.user
        ).exists()

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

class PhotoCommentSerializer(serializers.ModelSerializer):
    user=serializers.CharField(source="user.user_name",read_only=True)
    replies=serializers.SerializerMethodField()
    class Meta:
        model=Comment
        fields=[
            "id",
            "user",
            "text",
            "parent",
            "created_at",
            "replies",
        ]
    def get_replies(self,obj):
        replies=obj.replies.all().order_by("created_at")
        return PhotoCommentSerializer(replies,many=True).data
    



