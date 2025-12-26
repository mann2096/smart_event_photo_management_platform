from datetime import datetime
import os
from .ml import run_image_classifier
from celery import shared_task
from PIL import Image, ImageDraw, ImageFont
from PIL.ExifTags import TAGS,GPSTAGS
from django.conf import settings
from .models import Photo,PhotoVersion,PhotoTag,Tag

def _convert_gps(coord, ref):
    degrees = coord[0][0] / coord[0][1]
    minutes = coord[1][0] / coord[1][1]
    seconds = coord[2][0] / coord[2][1]

    value = degrees + (minutes / 60.0) + (seconds / 3600.0)
    if ref in ["S", "W"]:
        value = -value
    return round(value, 6)


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

    exif = {}
    gps_data = {}

    for tag, value in exif_raw.items():
        tag_name = TAGS.get(tag, tag)

        if tag_name == "GPSInfo":
            for gps_key, gps_value in value.items():
                gps_name = GPSTAGS.get(gps_key, gps_key)
                gps_data[gps_name] = gps_value
        else:
            exif[tag_name] = value

    parsed = {}

    parsed["camera_model"] = exif.get("Model")
    parsed["iso"] = exif.get("ISOSpeedRatings")

    if "FNumber" in exif:
        parsed["aperture"] = f"f/{exif['FNumber'][0] / exif['FNumber'][1]}"

    if "ExposureTime" in exif:
        parsed["shutter_speed"] = f"{exif['ExposureTime'][0]}/{exif['ExposureTime'][1]}"

    date_taken = exif.get("DateTimeOriginal")
    if date_taken:
        try:
            taken_at = datetime.strptime(date_taken, "%Y:%m:%d %H:%M:%S")
            photo.taken_at = taken_at
            parsed["taken_at"] = taken_at.isoformat()
        except Exception:
            pass

    if gps_data:
        if "GPSLatitude" in gps_data and "GPSLatitudeRef" in gps_data:
            parsed["latitude"] = _convert_gps(
                gps_data["GPSLatitude"], gps_data["GPSLatitudeRef"]
            )
        if "GPSLongitude" in gps_data and "GPSLongitudeRef" in gps_data:
            parsed["longitude"] = _convert_gps(
                gps_data["GPSLongitude"], gps_data["GPSLongitudeRef"]
            )

    photo.exif_data = parsed
    photo.save(update_fields=["exif_data", "taken_at"])

@shared_task
def generate_thumbnail(photo_id):
    photo = Photo.objects.get(id=photo_id)

    image = Image.open(photo.image.path)
    image.thumbnail((300, 300))

    thumb_path = photo.image.path.replace("originals", "thumbnails")
    os.makedirs(os.path.dirname(thumb_path), exist_ok=True)
    image.save(thumb_path)

    relative_path = thumb_path.replace(settings.MEDIA_ROOT + os.sep, "")

    PhotoVersion.objects.get_or_create(
        photo=photo,
        resolution="thumbnail",
        defaults={
            "image": relative_path,
            "is_watermarked": False
        }
    )

@shared_task
def apply_watermark(photo_id):
    photo = Photo.objects.get(id=photo_id)
    image = Image.open(photo.image.path).convert("RGBA")

    txt = Image.new("RGBA", image.size, (255,255,255,0))
    draw = ImageDraw.Draw(txt)

    font_size = max(20, image.size[0] // 30)
    font = ImageFont.load_default()

    draw.text(
        (20, image.size[1] - font_size - 20),
        "IIT Roorkee",
        fill=(255,255,255,120),
        font=font
    )

    watermarked = Image.alpha_composite(image, txt)

    watermarked_path = photo.image.path.replace("originals", "watermarked")
    os.makedirs(os.path.dirname(watermarked_path), exist_ok=True)
    watermarked.convert("RGB").save(watermarked_path)

    relative_path = watermarked_path.replace(settings.MEDIA_ROOT + os.sep, "")

    PhotoVersion.objects.get_or_create(
        photo=photo,
        resolution="watermarked",
        defaults={
            "image": relative_path,
            "is_watermarked": True
        }
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

