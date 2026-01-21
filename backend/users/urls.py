from django.urls import path
from .views import MeView, OmniportCallbackView, OmniportLoginStartView,RegisterView,UpdateProfileView,VerifyOTPView

urlpatterns = [
    path("me/",MeView.as_view()),
    path("register/",RegisterView.as_view()),
    path("verify-otp/",VerifyOTPView.as_view()),
    path("me/update/",UpdateProfileView.as_view()),
    path("omniport/login/", OmniportLoginStartView.as_view(), name="auth-omniport-login"),
    path("auth/omniport/callback/", OmniportCallbackView.as_view(), name="auth-omniport-callback"),
]
