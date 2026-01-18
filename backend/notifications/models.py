import uuid
from django.db import models
from django.conf import settings
User=settings.AUTH_USER_MODEL
class Notification(models.Model):
    NOTIFICATION_TYPES=[
        ("photo_upload","Photo Upload"),
        ("bulk_upload", "Bulk Upload"),
        ("comment","Comment"),
        ("reply","Reply"),
        ("photo_like","Photo Like"),
        ("tagged","Tagged"),
    ]
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    user=models.ForeignKey(User,on_delete=models.CASCADE,related_name="notifications")
    type=models.CharField(max_length=50,choices=NOTIFICATION_TYPES)
    payload=models.JSONField()
    is_read=models.BooleanField(default=False)
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering=["-created_at"]
    def __str__(self):
        return f"{self.type} → {self.user}"
