import uuid
from django.db import models

class Event(models.Model):
    id=models.UUIDField(primary_key=True, default=uuid.uuid4,editable=False)
    name=models.CharField(max_length=255)
    description=models.TextField(blank=True)
    start_date=models.DateField()
    end_date=models.DateField()
    created_by=models.ForeignKey("users.User",on_delete=models.SET_NULL,null=True,related_name="created_events",)
    VISIBILITY_CHOICES=[("public","Public"),("private","Private"),]
    visibility=models.CharField(max_length=10,choices=VISIBILITY_CHOICES,default="private",)
    def __str__(self):
        return self.name
    
class EventInvite(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    event=models.ForeignKey("events.Event",on_delete=models.CASCADE, related_name="invites")
    created_by=models.ForeignKey("users.User",on_delete=models.CASCADE)
    is_active=models.BooleanField(default=True)
    created_at=models.DateTimeField(auto_now_add=True)
    expires_at=models.DateTimeField(null=True, blank=True)
    def __str__(self):
        return f"Invite for {self.event.name}"