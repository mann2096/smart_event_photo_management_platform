import random
from django.conf import settings
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
from django.shortcuts import redirect
from urllib.parse import urlencode
import secrets
import requests

class OmniportLoginStartView(APIView):
    permission_classes = []
    def get(self,request):
        base = settings.OMNIPORT_BASE_URL
        client_id = settings.OMNIPORT_CLIENT_ID
        redirect_uri = settings.OMNIPORT_REDIRECT_URI
        if not (base and client_id and redirect_uri):
            return Response(
                {"detail": "Omniport OAuth is not configured."},
                status=400,
            )
        state = secrets.token_urlsafe(16)
        request.session["omniport_oauth_state"] = state
        authorize_url = f"{base}/oauth/authorise/"
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code", 
            "state": state,
        }
        return Response({
            "authorization_url": f"{authorize_url}?{urlencode(params)}"
        })

class OmniportCallbackView(APIView):
    permission_classes = []
    def get(self,request):
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        expected_state = request.session.get("omniport_oauth_state")
        if not code or (expected_state and state != expected_state):
            raise ValidationError("Invalid Omniport callback")
        try:
            token_resp = requests.post(
                f"{settings.OMNIPORT_BASE_URL}/open_auth/token/",
                data={
                    "client_id": settings.OMNIPORT_CLIENT_ID,
                    "client_secret": settings.OMNIPORT_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "redirect_uri": settings.OMNIPORT_REDIRECT_URI,
                    "code": code,
                },
                timeout=10,
            )
            token_resp.raise_for_status()
            access_token = token_resp.json().get("access_token")
        except Exception:
            raise ValidationError("Failed to obtain Omniport access token")
        if not access_token:
            raise ValidationError("Omniport did not return access token")
        data = get_omniport_user(access_token)
        omniport_id = str(data.get("userId") or data.get("id"))
        email = (
            data.get("contactInformation", {})
                .get("instituteWebmailAddress")
        )
        if not email:
            raise ValidationError("Omniport did not return institute email")
        user_name = (
            data.get("person", {})
                .get("shortName")
            or email.split("@")[0]
        )

        department = (
            data.get("student", {})
                .get("branch", {})
                .get("department", {})
                .get("name")
        )
        user,created = User.objects.get_or_create(
            email=email,
            defaults={
                "user_name": user_name,
                "provider": "omniport",
                "provider_user_id": omniport_id,
                "department": department or "",
                "is_active": True,
            },
        )
        if not created:
            updated = False
            if user.provider != "omniport":
                user.provider = "omniport"
                updated = True

            if user.provider_user_id != omniport_id:
                user.provider_user_id = omniport_id
                updated = True

            if department and user.department != department:
                user.department = department
                updated = True

            if not user.is_active:
                user.is_active = True
                updated = True

            if updated:
                user.save()
        refresh = RefreshToken.for_user(user)
        params = urlencode({
            "access":str(refresh.access_token),
            "refresh":str(refresh),
            "new_user": str(created).lower(),
        })
        redirect_url = (
            f"{settings.FRONTEND_LOGIN_REDIRECT_URL}"
            f"?{params}"
        )
        return redirect(redirect_url)

class RegisterView(APIView):
    permission_classes=[]
    def post(self,request):
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