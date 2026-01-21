import requests
from django.conf import settings

def get_omniport_user(access_token: str):
    user_resp = requests.get(
        f"{settings.OMNIPORT_BASE_URL}/open_auth/get_user_data/",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    user_resp.raise_for_status()
    return user_resp.json()
