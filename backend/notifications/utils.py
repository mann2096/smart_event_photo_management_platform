from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification
from users.models import User

def notify_user(user_id,payload):
    try:
        user=User.objects.get(id=user_id)
    except User.DoesNotExist:
        return
    notification_type=payload.get("type")
    if not notification_type:
        raise ValueError("Notification payload must include 'type'")
    notification=Notification.objects.create(
        user=user,
        type=notification_type,
        payload=payload,
    )
    channel_layer=get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{user_id}",
        {
            "type":"send_notification",
            "data":{
                "id":str(notification.id),
                "type":notification.type,
                "payload":notification.payload,
                "created_at":notification.created_at.isoformat(),
            },
        }
    )
