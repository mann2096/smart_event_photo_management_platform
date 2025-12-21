from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        roles={"Admin":[
                "upload_photo",
                "delete_any_photo",
                "create_event",
                "update_event",
                "assign_event_coordinator",
            ],
        }

        for role,perms in roles.items():
            group, _ =Group.objects.get_or_create(name=role)
            for codename in perms:
                perm=Permission.objects.get(codename=codename)
                group.permissions.add(perm)
