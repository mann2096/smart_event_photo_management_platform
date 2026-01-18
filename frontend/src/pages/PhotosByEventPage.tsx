import { Link } from "react-router-dom";
import { useGetPhotosQuery } from "../services/photosApi";
import type { Photo } from "../types/photo";
import { useAppSelector } from "../app/hooks";
import { selectStablePhotoFilters } from "../features/photos/photoFiltersSelectors";
import { groupPhotosByEvent } from "../utils/groupPhotosByEvent";
import { resolveImageUrl } from "../utils/resolveImageUrl";

export default function PhotosByEventPage() {
  const filters = useAppSelector(selectStablePhotoFilters);
  const {
    data,
    isLoading,
    isError,
  } = useGetPhotosQuery({
    ...filters,
    private_only: true,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full text-sm text-gray-500">
        Loading photos…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full text-sm text-gray-500">
        Failed to load photos
      </div>
    );
  }

  const photos: Photo[] = data?.results ?? [];
  const grouped = groupPhotosByEvent(photos);
  if (Object.keys(grouped).length === 0) {
    return (
      <div className="px-6 py-6 text-sm text-gray-500">
        No photos match your filters.
      </div>
    );
  }
  return (
    <div className="px-6 py-6 space-y-10">
      <h2 className="text-2xl font-semibold text-gray-900">
        Your events
      </h2>

      {Object.entries(grouped).map(([eventId, eventPhotos]) => (
        <section key={eventId} className="space-y-3">
          <Link
            to={`/events/${eventId}`}
            className="inline-block text-lg font-medium text-gray-800 hover:underline"
          >
            {eventPhotos[0].event.name}
          </Link>

          <div className="flex gap-3 overflow-x-auto">
            {eventPhotos.slice(0, 6).map((photo) => (
              <img
                key={photo.id}
                src={resolveImageUrl(photo.image)}
                alt=""
                loading="lazy"
                className="h-36 w-36 object-cover rounded-lg
                           flex-shrink-0 pointer-events-none"
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
