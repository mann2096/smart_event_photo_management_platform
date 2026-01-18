from datetime import datetime
import os
from .ml import run_image_classifier
from celery import shared_task
from PIL import Image, ImageDraw, ImageFont
from PIL.ExifTags import TAGS,GPSTAGS
from django.conf import settings
from django.db import transaction
import logging
from django.utils.timezone import make_aware
from django.core.files import File
from pathlib import Path
logger = logging.getLogger(__name__)

def _rational_to_float(value):
    try:
        if hasattr(value,"numerator"):
            return float(value.numerator)/float(value.denominator)
        if isinstance(value, tuple):
            return float(value[0])/float(value[1])
        return float(value)
    except Exception:
        return None

@shared_task(bind=True,autoretry_for=(Exception,),retry_kwargs={"max_retries":3})
def extract_exif_data(self,photo_id):
    from photos.models import Photo
    logger.warning("[EXIF] TASK STARTED | photo_id=%s", photo_id)
    exif={}
    gps_data={}
    try:
        photo=Photo.objects.get(id=photo_id)
        logger.warning("[EXIF] Photo loaded | path=%s", photo.image.path)
    except Photo.DoesNotExist:
        logger.error(" [EXIF] Photo not found")
        return
    try:
        image=Image.open(photo.image.path)
        exif_raw=image.getexif()
        logger.warning(
            "[EXIF] Image opened | exif_present=%s | exif_len=%s",
            bool(exif_raw),
            len(exif_raw) if exif_raw else 0,
        )
    except Exception:
        logger.exception(" [EXIF] Failed to open image")
        return
    if not exif_raw:
        logger.warning("[EXIF] No EXIF data found")
        return
    for tag_id,value in exif_raw.items():
        tag=TAGS.get(tag_id,tag_id)
        if tag=="GPSInfo" and isinstance(value, dict):
            for gps_id, gps_val in value.items():
                gps_tag = GPSTAGS.get(gps_id, gps_id)
                gps_data[gps_tag] = gps_val
        else:
            exif[tag]=value
    logger.warning(
        " [EXIF] KEYS (%d): %s",
        len(exif),
        sorted(map(str, exif.keys())),
    )
    logger.warning(" ISO = %r", exif.get("ISOSpeedRatings"))
    logger.warning(" FNumber = %r", exif.get("FNumber"))
    logger.warning(" ExposureTime = %r", exif.get("ExposureTime"))
    parsed={}
    parsed["camera_make"]=exif.get("Make")
    parsed["camera_model"]=exif.get("Model")
    iso=exif.get("ISOSpeedRatings") or exif.get("PhotographicSensitivity")
    if iso:
        parsed["iso"] = iso
    if "FNumber" in exif:
        f = _rational_to_float(exif["FNumber"])
        if f:
            parsed["aperture"] = f"f/{round(f, 1)}"
    if "ExposureTime" in exif:
        exp = exif["ExposureTime"]
        if hasattr(exp, "numerator"):
            parsed["shutter_speed"] = f"{exp.numerator}/{exp.denominator}"
        elif isinstance(exp, tuple):
            parsed["shutter_speed"] = f"{exp[0]}/{exp[1]}"
        else:
            parsed["shutter_speed"] = str(exp)
    logger.warning(" [EXIF] FINAL PARSED KEYS = %s", sorted(parsed.keys()))
    if not parsed:
        logger.warning(" [EXIF] Parsed empty — skipping save")
        return
    photo.exif_data = parsed
    photo.save(update_fields=["exif_data"])
    logger.warning(" [EXIF] SAVED | photo_id=%s", photo.id)


@shared_task(bind=True)
def generate_thumbnail(self,photo_id):
    from photos.models import Photo,PhotoVersion
    try:
        photo=Photo.objects.get(id=photo_id)
    except Photo.DoesNotExist:
        return
    if not photo.image:
        return
    img=Image.open(photo.image.path)
    img.thumbnail((400, 400))
    base,ext=os.path.splitext(os.path.basename(photo.image.name))
    thumb_filename=f"{base}_thumb{ext}"
    thumb_dir=os.path.join(settings.MEDIA_ROOT,"photos/versions")
    os.makedirs(thumb_dir, exist_ok=True)
    thumb_path = os.path.join(thumb_dir,thumb_filename)
    img.save(thumb_path)
    with open(thumb_path, "rb") as f:
        PhotoVersion.objects.update_or_create(
            photo=photo,
            resolution="400x400",
            is_watermarked=False,
            defaults={
                "image":File(f,name=thumb_filename),
            },
        )

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=10, retry_kwargs={"max_retries": 3})
def apply_watermark(self, photo_id):
    from pathlib import Path
    from django.conf import settings
    from django.core.files import File
    from PIL import Image, ImageDraw, ImageFont
    from photos.models import PhotoVersion
    from .models import Photo

    try:
        photo = Photo.objects.get(id=photo_id)
    except Photo.DoesNotExist:
        return

    if not photo.image:
        return
    if PhotoVersion.objects.filter(
        photo=photo,
        resolution="original",
        is_watermarked=True,
    ).exists():
        return
    base_img = Image.open(photo.image.path)
    if base_img.mode not in ("RGB", "RGBA"):
        base_img = base_img.convert("RGB")

    base_img = base_img.convert("RGBA")
    width, height = base_img.size

    overlay = Image.new("RGBA", base_img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    watermark_text = "SensePic"
    try:
        font_path = Path(settings.BASE_DIR) / "static/fonts/Roboto-Bold.ttf"
        font_size = int(min(width, height) * 0.07) 
        font = ImageFont.truetype(str(font_path), font_size)
    except Exception:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), watermark_text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    padding = int(min(width, height) * 0.04)
    x = width - text_width - padding
    y = height - text_height - padding
    draw.text(
        (x + 2, y + 2),
        watermark_text,
        font=font,
        fill=(0, 0, 0, 180), 
    )
    draw.text(
        (x, y),
        watermark_text,
        font=font,
        fill=(255, 255, 255, 230), 
    )
    combined = Image.alpha_composite(base_img, overlay)
    base_name = Path(photo.image.name).stem
    wm_filename = f"{base_name}_watermarked.jpg"
    wm_dir = Path(settings.MEDIA_ROOT) / "photos" / "versions"
    wm_dir.mkdir(parents=True, exist_ok=True)

    wm_path = wm_dir / wm_filename

    combined.convert("RGB").save(
        wm_path,
        format="JPEG",
        quality=90,
        subsampling=0,
        optimize=True,
    )
    with open(wm_path, "rb") as f:
        PhotoVersion.objects.create(
            photo=photo,
            resolution="original",
            is_watermarked=True,
            image=File(f, name=wm_filename),
        )


@shared_task(bind=True,autoretry_for=(Exception,),retry_backoff=5,retry_kwargs={"max_retries":3})
def auto_tag_photo(self, photo_id):
    from photos.models import Photo,Tag,PhotoTag
    photo = Photo.objects.filter(id=photo_id).first()
    if not photo:
        return
    predictions=run_image_classifier(photo.image.path)
    for tag_name,confidence in predictions:
        tag, _ =Tag.objects.get_or_create(name=tag_name)
        PhotoTag.objects.get_or_create(
            photo=photo,
            tag=tag,
            defaults={"confidence":confidence}
        )

