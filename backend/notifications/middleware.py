from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id, is_active=True)
    except User.DoesNotExist:
        return None


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token")
        if not token_list:
            await send({"type": "websocket.close", "code": 4401})
            return
        token = token_list[0]
        try:
            access = AccessToken(token)
            user_id = access.get("user_id")
            if not user_id:
                raise InvalidToken("Missing user_id")
            user = await get_user(user_id)
            if not user:
                raise InvalidToken("Invalid user")
            scope["user"] = user
        except (TokenError, InvalidToken):
            await send({"type": "websocket.close", "code": 4401})
            return

        return await super().__call__(scope, receive, send)
