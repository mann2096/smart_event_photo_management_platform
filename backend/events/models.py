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

    class Meta:
        permissions=[
            ("update_event","Can update event"),
            ("assign_event_coordinator", "Can change event coordinator for any event"),
        ]

    def __str__(self):
        return self.name