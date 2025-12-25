import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .models import EmailOTP, User
from .serializers import LoginSerializer,UserSerializer,RegisterSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

class RegisterView(APIView):
    permission_classes=[]
    def post(self,request):
        serializer=RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user=serializer.save()
        otp=str(random.randint(100000,999999))
        EmailOTP.objects.create(user=user,otp=otp)
        return Response({"detail":"OTP sent"},status=201)

class OAuthLoginView(APIView):
    permission_classes=[]
    def post(self,request):
        provider=request.data["provider"]
        provider_user_id=request.data["provider_user_id"]
        email=request.data.get("email")
        user, _ =User.objects.get_or_create(
            provider=provider,
            provider_user_id=provider_user_id,
            defaults={
                "email":email,
                "is_active":True,
            }
        )
        refresh=RefreshToken.for_user(user)
        return Response({
            "access":str(refresh.access_token),
            "refresh":str(refresh),
        })

class LoginView(APIView):
    permission_classes=[]
    def post(self,request):
        serializer=LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user=serializer.validated_data["user"]
        refresh=RefreshToken.for_user(user)
        return Response({
            "access":str(refresh.access_token),
            "refresh":str(refresh),
        })

class MeView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        return Response(UserSerializer(request.user).data)

class VerifyOTPView(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request):
        otp=request.data.get("otp")
        record=EmailOTP.objects.filter(user=request.user,otp=otp,is_used=False).first()
        if not record:
            return Response({"error":"Invalid OTP"},status=400)
        record.is_used=True
        record.save()
        request.user.is_active=True
        request.user.save()
        return Response({"status":"verified"})
