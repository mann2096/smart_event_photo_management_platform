from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .models import EmailOTP
from .serializers import LoginSerializer,UserSerializer
from rest_framework.permissions import IsAuthenticated

class LoginView(APIView):
    permission_classes = []
    def post(self,request):
        serializer=LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user=serializer.validated_data["user"]
        token, _ =Token.objects.get_or_create(user=user)

        return Response({"token":token.key})

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
        return Response({"status": "verified"})
