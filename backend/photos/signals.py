from django.db.models.signals import post_save
from django.dispatch import receiver
from celery import chain
from django.db.models.signals import post_delete
from .models import Photo, PhotoVersion
import os

@receiver(post_save,sender="photos.Photo")
def run_photo_processing_tasks(sender, instance, created, **kwargs):
    if not created:
        return
    from .tasks import (
        extract_exif_data,
        generate_thumbnail,
        apply_watermark,
        auto_tag_photo,
    )
    chain(
        extract_exif_data.si(instance.id),
        generate_thumbnail.si(instance.id),
        apply_watermark.si(instance.id),
        auto_tag_photo.si(instance.id),
    ).delay()

@receiver(post_delete,sender=Photo)
def delete_original_photo_file(sender, instance, **kwargs):
    if instance.image and instance.image.path:
        try:
            if os.path.exists(instance.image.path):
                os.remove(instance.image.path)
        except Exception:
            pass