import os
from celery import Celery

# Set default Django settings
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "core.settings"
)

app = Celery("core")

# Load settings from Django settings.py
app.config_from_object(
    "django.conf:settings",
    namespace="CELERY"
)

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()
