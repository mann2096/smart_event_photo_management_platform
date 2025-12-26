import random
from django.conf import settings
from django.core.mail import send_mail

def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_email(email,otp):
    send_mail(
        subject="Verify your email",
        message=f"Your verification OTP is: {otp}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )