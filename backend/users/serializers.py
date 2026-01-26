from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import User

class LoginSerializer(serializers.Serializer):
    email=serializers.EmailField()
    password=serializers.CharField(write_only=True)
    def validate(self, data):
        email=data["email"]
        password=data["password"]
        try:
            user=User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials")
        if user.provider=="omniport":
            raise serializers.ValidationError(
                "This account uses Omniport login. Please login using Omniport."
            )
        if not user.is_active:
            raise serializers.ValidationError(
                "Account not verified. Please verify OTP."
            )
        user=authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        data["user"]=user
        return data


class UserSerializer(serializers.ModelSerializer):
    profile_photo = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = [
            "id",
            "user_name",
            "email",
            "provider",
            "bio",
            "batch",
            "department",
            "profile_photo",
            "created_at",
            "is_superuser"
        ]

    def get_profile_photo(self, obj):
        if not obj.profile_photo:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.profile_photo.url)
        return obj.profile_photo.url

class RegisterSerializer(serializers.Serializer):
    email=serializers.EmailField()
    password=serializers.CharField(write_only=True)
    def create(self,validated_data):
        user=User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            is_active=False
        )
        return user