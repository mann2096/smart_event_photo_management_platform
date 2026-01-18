from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification

def notify_user(user_id:str,payload:dict):
    notification=Notification.objects.create(
        user_id=user_id,
        type=payload["type"],
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
                "is_read":notification.is_read,
                "created_at":notification.created_at.isoformat(),
            },
        },
    )
    return notification

def build_notification_payload(*,type:str,actor=None,event=None,photo=None,extra=None,):
    payload={
        "type":type,
    }
    if actor:
        payload["actor"]={
            "id":str(actor.id),
            "user_name":actor.user_name,
            "email":actor.email,
        }
    if event:
        payload["event_id"]=str(event.id)
        payload["event_name"]=event.name
        payload["event_visibility"]=event.visibility
    if photo:
        payload["photo_id"]=str(photo.id)
    if extra:
        payload.update(extra)
        
    return payload
