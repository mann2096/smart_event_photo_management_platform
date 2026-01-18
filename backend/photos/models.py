from django.utils import timezone
import uuid
from django.db import models

class Photo(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    event=models.ForeignKey("events.Event",on_delete=models.CASCADE,related_name="photos",)
    uploaded_by=models.ForeignKey("users.User",on_delete=models.SET_NULL,null=True,related_name="uploaded_photos",)
    image=models.ImageField(upload_to="photos/originals/")
    exif_data=models.JSONField(null=True,blank=True)
    uploaded_at=models.DateTimeField(auto_now_add=True)
    views=models.PositiveIntegerField(default=0)
    downloads=models.PositiveIntegerField(default=0)
    taken_at=models.DateTimeField(null=True, blank=True)

class PhotoVersion(models.Model):
    photo=models.ForeignKey("photos.Photo",on_delete=models.CASCADE,related_name="versions",)
    image=models.ImageField(upload_to="photos/versions/")
    resolution=models.CharField(max_length=50)
    is_watermarked=models.BooleanField(default=False)
    class Meta:
        unique_together=("photo","resolution","is_watermarked")

class Tag(models.Model):
    name=models.CharField(max_length=100,unique=True)
    def __str__(self):
        return self.name

class PhotoTag(models.Model):
    photo=models.ForeignKey("photos.Photo",on_delete=models.CASCADE,related_name="photo_tags"  )
    tag=models.ForeignKey(Tag, on_delete=models.CASCADE)
    confidence=models.FloatField(null=True, blank=True)
    class Meta:
        unique_together=("photo","tag")

class Comment(models.Model):
    photo=models.ForeignKey("photos.Photo",on_delete=models.CASCADE,related_name="comments")
    user=models.ForeignKey("users.User", on_delete=models.CASCADE)
    parent=models.ForeignKey("self",null=True,blank=True,on_delete=models.CASCADE,related_name="replies",)
    text=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)

class PhotoLike(models.Model):
    user=models.ForeignKey("users.User",on_delete=models.CASCADE,related_name="liked_photos",)
    photo=models.ForeignKey("photos.Photo",on_delete=models.CASCADE,related_name="likes",)
    class Meta:
        unique_together=("user","photo")

class PhotoShareLink(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    photo=models.ForeignKey("photos.Photo",on_delete=models.CASCADE,related_name="share_links")
    token=models.CharField(max_length=64,unique=True)
    expires_at=models.DateTimeField(null=True, blank=True)
    allow_download=models.BooleanField(default=True)
    created_at=models.DateTimeField(auto_now_add=True)
    def is_expired(self):
        return self.expires_at and timezone.now()>self.expires_at
    
class PhotoView(models.Model):
    user=models.ForeignKey("users.User",on_delete=models.CASCADE,related_name="photo_views")
    photo=models.ForeignKey("photos.Photo",on_delete=models.CASCADE,related_name="view_records")
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together=("user","photo")
