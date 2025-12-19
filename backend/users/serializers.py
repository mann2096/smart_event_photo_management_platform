from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import User

class LoginSerializer(serializers.Serializer):
    email=serializers.EmailField()
    password=serializers.CharField(write_only=True)

    def validate(self, data):
        user=authenticate(email=data["email"],password=data["password"])
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
        read_only_fields = ["created_at"]