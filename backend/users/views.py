import random
from django.forms import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from users.omniport import get_omniport_user
from users.utils import send_otp_email
from .models import EmailOTP, User
from .serializers import LoginSerializer,UserSerializer,RegisterSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import ValidationError

class OmniportCallbackView(APIView):
    permission_classes=[]
    def get(self,request):
        code=request.query_params.get("code")
        if not code:
            raise ValidationError("Missing OAuth code")
        data=get_omniport_user(code)
        omniport_id=data["id"]
        email=data.get("email")
        if not email:
            raise ValidationError("Omniport did not return email")
        user=User.objects.filter(email=email).first()
        created=False
        if user:
            if user.provider=="email":
                user.provider="omniport"
                user.provider_user_id=omniport_id
                user.is_active=True
                user.save(
                    update_fields=["provider","provider_user_id","is_active"]
                )
        else:
            user=User.objects.create(
                email=email,
                user_name=email.split("@")[0],
                provider="omniport",
                provider_user_id=omniport_id,
                is_active=True,
            )
            created=True
        refresh=RefreshToken.for_user(user)
        return Response(
            {
                "access":str(refresh.access_token),
                "refresh":str(refresh),
                "new_user":created,
            }
        )

class RegisterView(APIView):
    permission_classes=[]
    def post(self, request):
        email=request.data.get("email")
        existing_user=User.objects.filter(email=email).first()
        if existing_user:
            if existing_user.provider=="omniport":
                return Response(
                    {
                        "error":(
                            "This email is already registered via Omniport. "
                            "Please login using Omniport."
                        )
                    },
                    status=400,
                )
            return Response(
                {"error":"Email already registered. Please login."},
                status=400,
            )
        serializer=RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user=serializer.save(is_active=False)
        EmailOTP.objects.filter(user=user,is_used=False).update(is_used=True)
        otp=str(random.randint(100000,999999))
        EmailOTP.objects.create(user=user, otp=otp)
        send_otp_email(user.email,otp)
        return Response({"detail":"OTP sent"},status=201)


class MeView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        return Response(UserSerializer(request.user).data)

class VerifyOTPView(APIView):
    permission_classes=[]
    def post(self,request):
        email=request.data.get("email")
        otp=request.data.get("otp")
        if not email or not otp:
            return Response({"error":"Email and OTP required"},status=400)
        try:
            user=User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error":"User not found"},status=404)

        record=EmailOTP.objects.filter(
            user=user,
            otp=otp,
            is_used=False
        ).first()
        if not record:
            return Response({"error":"Invalid or expired OTP"},status=400)
        record.is_used=True
        record.save()
        user.is_active=True
        user.save(update_fields=["is_active"])
        refresh=RefreshToken.for_user(user)
        return Response({
            "access":str(refresh.access_token),
            "refresh":str(refresh),
        })

class UpdateProfileView(APIView):
    permission_classes=[IsAuthenticated]
    def patch(self,request):
        serializer=UserSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)