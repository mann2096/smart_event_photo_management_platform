import requests
from django.conf import settings

TOKEN_URL = "https://channeli.in/open_auth/token/"
USER_URL = "https://channeli.in/open_auth/get_user_data/"

def get_omniport_user(code):
    token_resp = requests.post(
        TOKEN_URL,
        data={
            "client_id": settings.OMNIPORT_CLIENT_ID,
            "client_secret": settings.OMNIPORT_CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.OMNIPORT_REDIRECT_URI,
        },
        timeout=10,
    )
    token_resp.raise_for_status()
    access_token = token_resp.json()["access_token"]
    user_resp = requests.get(
        USER_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    user_resp.raise_for_status()

    return user_resp.json()
