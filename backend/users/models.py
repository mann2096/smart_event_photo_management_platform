import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self,email,password=None,**extra_fields):
        if not email:
            raise ValueError("Email is required")
        email=self.normalize_email(email)
        if not extra_fields.get("user_name"):
            extra_fields["user_name"]=email.split("@")[0]
        user=self.model(email=email,**extra_fields)
        user.set_password(password)
        user.is_active=False
        user.save(using=self._db)
        return user
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff",True)
        extra_fields.setdefault("is_superuser",True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser,PermissionsMixin):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    user_name=models.CharField(max_length=30,unique=True)
    email=models.EmailField(unique=True)
    provider=models.CharField(max_length=50,default="email")
    provider_user_id=models.CharField(max_length=255,null=True,blank=True)
    bio=models.TextField(blank=True)
    batch=models.CharField(max_length=20, blank=True)
    department=models.CharField(max_length=100,blank=True)
    profile_photo=models.ImageField(upload_to="profiles/",null=True,blank=True)
    is_staff=models.BooleanField(default=False)
    created_at=models.DateTimeField(auto_now_add=True)
    objects=UserManager()
    is_active=models.BooleanField(default=False)
    USERNAME_FIELD="email"
    REQUIRED_FIELDS=[]

    def __str__(self):
        return self.email

class UserEvent(models.Model):
    ROLE_CHOICES=[("coordinator","Coordinator"),("photographer","Photographer"),("member","Member"),]
    user=models.ForeignKey("users.User",models.CASCADE,related_name="event_roles",)
    event=models.ForeignKey("events.Event",on_delete=models.CASCADE,related_name="participants",)
    role=models.CharField(max_length=20,choices=ROLE_CHOICES)
    class Meta:
        unique_together=("user","event")

class Favourite(models.Model):
    user=models.ForeignKey("users.User",on_delete=models.CASCADE,related_name="favourites",)
    photo=models.ForeignKey("photos.Photo",on_delete=models.CASCADE,related_name="favourited_by",)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together =("user","photo")

class TaggedBy(models.Model):
    tagged_user=models.ForeignKey("users.User",on_delete=models.CASCADE,related_name="tagged_photos",)
    tagged_by=models.ForeignKey("users.User",on_delete=models.CASCADE,related_name="tagged_others",)
    photo=models.ForeignKey("photos.Photo",on_delete=models.CASCADE,related_name="tags",)
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ("tagged_user", "photo")

class EmailOTP(models.Model):
    user=models.ForeignKey("users.User",on_delete=models.CASCADE)
    otp=models.CharField(max_length=6)
    created_at=models.DateTimeField(auto_now_add=True)
    is_used=models.BooleanField(default=False)
