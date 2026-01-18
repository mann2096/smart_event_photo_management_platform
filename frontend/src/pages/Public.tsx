import { Link } from "react-router-dom";
import { useGetPublicEventsQuery } from "../services/eventsApi";
import { useGetPhotosQuery } from "../services/photosApi";
import { groupPhotosByEvent } from "../utils/groupPhotosByEvent";
import { useAppSelector } from "../app/hooks";
import { skipToken } from "@reduxjs/toolkit/query";
import { selectStablePhotoFilters } from "../features/photos/photoFiltersSelectors";
import { resolveImageUrl } from "../utils/resolveImageUrl";

export default function Public() {
  const globalFilters = useAppSelector(selectStablePhotoFilters);
  const {
    data: publicEvents,
    isLoading: eventsLoading,
  } = useGetPublicEventsQuery();

  const eventIds =
    Array.isArray(publicEvents) && publicEvents.length > 0
      ? publicEvents.map((e) => e.id)
      : null;
  const {
    data: photosResponse,
    isLoading: photosLoading,
  } = useGetPhotosQuery(
    eventIds
      ? {
          ...globalFilters,
          eventIds,
        }
      : skipToken
  );
  if (eventsLoading || photosLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        Loading public photos…
      </div>
    );
  }

  const photos = photosResponse?.results ?? [];
  const grouped = groupPhotosByEvent(photos);
  if (Object.keys(grouped).length === 0) {
    return (
      <div className="px-6 py-6 space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Public galleries
        </h2>
        <p className="text-sm text-gray-500">
          No public photos available.
        </p>
      </div>
    );
  }
  return (
    <div className="px-6 py-6 space-y-10">
      <h2 className="text-2xl font-semibold text-gray-900">
        Public galleries
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
