import { store } from "../app/store";

export async function downloadWatermarkedPhoto(photoId: string) {
  const { accessToken } = store.getState().auth;
  if (!accessToken) {
    throw new Error("Not authenticated");
  }
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/api/photos/items/${photoId}/download/`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "ngrok-skip-browser-warning": "true",
      },
    }
  );

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.startsWith("image/")) {
    const text = await response.text();
    console.error("NOT IMAGE RESPONSE:", text);
    throw new Error("Server did not return image");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
}
