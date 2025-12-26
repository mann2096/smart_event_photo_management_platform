from django.core.mail import send_mail
from django.conf import settings

def send_notification_email(
    to_email: str,
    subject: str,
    message: str,
):
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[to_email],
        fail_silently=True, 
    )
