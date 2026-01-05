from django.contrib import admin
from .models import User, UserEvent, Favourite, TaggedBy, EmailOTP

admin.site.register(User)
admin.site.register(UserEvent)
admin.site.register(Favourite)
admin.site.register(TaggedBy)
admin.site.register(EmailOTP)
