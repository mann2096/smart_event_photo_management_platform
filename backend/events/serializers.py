from rest_framework import serializers
from .models import Event

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model=Event
        fields=[
            "id",
            "name",
            "description",
            "start_date",
            "end_date",
            "visibility",
            "created_by",
        ]
        read_only_fields=["id","created_by"]
