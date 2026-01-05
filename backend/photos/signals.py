from django.db.models.signals import post_save
from django.dispatch import receiver
from celery import chain

from .models import Photo
from .tasks import (
    extract_exif_data,
    generate_thumbnail,
    apply_watermark,
    auto_tag_photo,
)

@receiver(post_save, sender=Photo)
def run_photo_processing_tasks(sender, instance, created, **kwargs):
    if not created:
        return

    chain(
        extract_exif_data.si(instance.id),
        generate_thumbnail.si(instance.id),
        apply_watermark.si(instance.id),
        auto_tag_photo.si(instance.id),
    ).delay()

