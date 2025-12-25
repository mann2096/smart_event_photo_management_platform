from django.urls import path
from .views import LoginView,MeView, OAuthLoginView,RegisterView,VerifyOTPView

urlpatterns = [
    path("login/",LoginView.as_view()),
    path("me/", MeView.as_view()),
    path("register/",RegisterView.as_view()),
    path("verify-otp/",VerifyOTPView.as_view()),
    path("oauth/",OAuthLoginView.as_view()),

]
