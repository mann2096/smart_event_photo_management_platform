import os
from .ml import run_image_classifier
from celery import shared_task
from PIL import Image
from PIL.ExifTags import TAGS
from django.conf import settings
from .models import Photo,PhotoVersion,PhotoTag,Tag

@shared_task
def extract_exif_data(photo_id):
    try:
        photo = Photo.objects.get(id=photo_id)
    except Photo.DoesNotExist:
        return

    image = Image.open(photo.image.path)
    exif_raw = image._getexif()

    if not exif_raw:
        return

    exif_data = {}
    for tag, value in exif_raw.items():
        tag_name = TAGS.get(tag, tag)
        exif_data[tag_name] = value

    photo.exif_data = exif_data
    photo.save(update_fields=["exif_data"])

@shared_task
def generate_thumbnail(photo_id):
    photo=Photo.objects.get(id=photo_id)
    image=Image.open(photo.image.path)
    image.thumbnail((300,300))
    thumb_path=photo.image.path.replace("originals","thumbnails")
    os.makedirs(os.path.dirname(thumb_path),exist_ok=True)
    image.save(thumb_path)

@shared_task
def apply_watermark(photo_id):
    photo=Photo.objects.get(id=photo_id)
    image=Image.open(photo.image.path)
    draw=ImageDraw.Draw(image)
    draw.text((20,20),"IITR",fill=(255, 255, 255, 128))
    watermarked_path=photo.image.path.replace("originals","watermarked")
    os.makedirs(os.path.dirname(watermarked_path),exist_ok=True)
    image.save(watermarked_path)
    relative_path=watermarked_path.replace(
        settings.MEDIA_ROOT+os.sep,""
    )
    PhotoVersion.objects.create(
        photo=photo,
        image=relative_path,
        resolution="watermarked_original",
        is_watermarked=True
    )

@shared_task(bind=True,autoretry_for=(Exception,),retry_backoff=5,retry_kwargs={"max_retries":3})
def auto_tag_photo(self, photo_id):
    photo=Photo.objects.get(id=photo_id)
    predictions=run_image_classifier(photo.image.path)
    for tag_name,confidence in predictions:
        tag, _ =Tag.objects.get_or_create(name=tag_name)
        PhotoTag.objects.get_or_create(
            photo=photo,
            tag=tag,
            defaults={"confidence":confidence}
        )

