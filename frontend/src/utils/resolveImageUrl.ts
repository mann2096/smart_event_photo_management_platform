export function resolveImageUrl(url: string) {
  if (!url) return "";
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
  const base = API_BASE.replace(/\/$/, "");
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  if (url.startsWith("https://")) {
    return url;
  }
  return `${base}${url}`;
}
