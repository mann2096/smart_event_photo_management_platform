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
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "user_name",
            "bio",
            "batch",
            "department",
            "profile_photo",
            "created_at",
        ]
        read_only_fields = ["created_at","id","email"]

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