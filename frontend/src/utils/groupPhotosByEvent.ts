import type { Photo } from "../types/photo";

export function groupPhotosByEvent(photos: Photo[]) {
  const grouped: Record<string, Photo[]> = {};

  photos.forEach((photo) => {
    const eventId = photo.event.id;

    if (!grouped[eventId]) {
      grouped[eventId] = [];
    }

    grouped[eventId].push(photo);
  });

  return grouped;
}
