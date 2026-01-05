from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from users.models import User
from channels.db import database_sync_to_async


@database_sync_to_async
def get_user_from_token(token):
    try:
        access = AccessToken(token)
        user_id = access["user_id"]
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    def __call__(self, scope):
        return JWTAuthMiddlewareInstance(scope, self.inner)


class JWTAuthMiddlewareInstance:
    def __init__(self, scope, inner):
        self.scope = dict(scope)
        self.inner = inner

    async def __call__(self, receive, send):
        query_string = self.scope.get("query_string", b"").decode()
        params = parse_qs(query_string)

        token = params.get("token")
        if token:
            self.scope["user"] = await get_user_from_token(token[0])
        else:
            self.scope["user"] = AnonymousUser()

        return await self.inner(self.scope, receive, send)
