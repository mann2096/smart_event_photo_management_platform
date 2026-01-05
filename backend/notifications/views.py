from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Notification
from .serializers import NotificationSerializer

class NotificationListAPI(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        notifications=Notification.objects.filter(
            user=request.user
        ).order_by("-created_at")
        serializer=NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

class MarkNotificationReadAPI(APIView):
    permission_classes=[IsAuthenticated]

    def post(self,request,notification_id):
        notification=get_object_or_404(Notification,id=notification_id,user=request.user,)
        notification.is_read=True
        notification.save(update_fields=["is_read"])
        return Response(
            {"status":"ok"},
            status=status.HTTP_200_OK
        )
