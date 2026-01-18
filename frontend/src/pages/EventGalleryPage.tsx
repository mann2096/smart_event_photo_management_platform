import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import {
  useGetPhotosQuery,
  useBulkDeletePhotosMutation,
} from "../services/photosApi";
import type { Photo } from "../types/photo";
import PhotoModal from "../components/PhotoModal";
import BulkPhotoUploader from "../components/BulkPhotoUploader";
import { useAppSelector } from "../app/hooks";
import { useEventRole } from "../utils/useEventRole";
import { selectStablePhotoFilters } from "../features/photos/photoFiltersSelectors";
import { resolveImageUrl } from "../utils/resolveImageUrl";

export default function EventGalleryPage() {
  const { eventId } = useParams<{ eventId: string }>();
  if (!eventId) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Invalid event
      </div>
    );
  }
  const { role } = useEventRole(eventId);

  const isSuperuser = useAppSelector(
    (s) => s.auth.user?.is_superuser
  );

  const currentUserId = useAppSelector(
    (s) => s.auth.user?.id
  );

  const canUpload =
    role === "photographer" ||
    role === "coordinator" ||
    isSuperuser === true;

  const canManageEvent =
    isSuperuser || role === "coordinator";
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] =
    useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] =
    useState<Photo | null>(null);
  const globalFilters = useAppSelector(selectStablePhotoFilters);

  const {
    data,
    isLoading,
    isError,
  } = useGetPhotosQuery({
    ...globalFilters,
    eventId,
  });

  const photos: Photo[] = data?.results ?? [];

  const [bulkDeletePhotos, { isLoading: deleting }] =
    useBulkDeletePhotosMutation();
  const canDeletePhoto = (photo: Photo) => {
    if (isSuperuser) return true;
    if (role === "coordinator") return true;
    return (
      role === "photographer" &&
      photo.uploaded_by.id === currentUserId
    );
  };

  const toggleSelectPhoto = (id: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id]
    );
  };
  const handleDelete = async () => {
    if (selectedPhotoIds.length === 0) return;

    if (
      !confirm(
        `Delete ${selectedPhotoIds.length} photo(s)?`
      )
    ) {
      return;
    }

    try {
      await bulkDeletePhotos({
        photo_ids: selectedPhotoIds,
      }).unwrap();

      alert("Photos deleted successfully");
      setSelectedPhotoIds([]);
      setDeleteMode(false);
    } catch {
      alert("Delete failed");
    }
  };
  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading photos…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Failed to load photos
      </div>
    );
  }
  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Event gallery
        </h2>

        {canManageEvent && (
          <Link
            to={`/events/${eventId}/manage`}
            className="px-4 py-2 text-sm rounded-lg
                       bg-blue-600 text-white
                       hover:bg-blue-700 font-medium"
          >
            Manage event
          </Link>
        )}
      </div>
      {canUpload && (
        <div className="rounded-xl border bg-white p-4">
          <BulkPhotoUploader eventId={eventId} />
        </div>
      )}
      {canUpload && (
        <div className="flex items-center gap-3">
          {!deleteMode ? (
            <button
              onClick={() => setDeleteMode(true)}
              className="px-4 py-2 text-sm
                         bg-red-50 text-red-700
                         rounded-lg font-medium"
            >
              Delete photos
            </button>
          ) : (
            <>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm
                           bg-red-600 text-white
                           rounded-lg disabled:opacity-50"
              >
                Delete Selected ({selectedPhotoIds.length})
              </button>

              <button
                onClick={() => {
                  setDeleteMode(false);
                  setSelectedPhotoIds([]);
                }}
                className="px-3 py-2 text-sm
                           border rounded-lg"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
      <div
        className="
          columns-2
          sm:columns-3
          md:columns-4
          lg:columns-5
          gap-4
        "
      >
        {photos.map((photo) => {
          const deletable = canDeletePhoto(photo);
          const selected = selectedPhotoIds.includes(photo.id);

          return (
            <div
              key={photo.id}
              onClick={() => {
                if (deleteMode) {
                  if (!deletable) return;
                  toggleSelectPhoto(photo.id);
                } else {
                  setSelectedPhoto(photo);
                }
              }}
              className={`
                mb-4
                break-inside-avoid
                relative
                cursor-pointer
                rounded-lg
                overflow-hidden
                transition
                ${
                  deleteMode && !deletable
                    ? "opacity-40 cursor-not-allowed"
                    : ""
                }
                ${
                  deleteMode && selected
                    ? "ring-4 ring-red-500"
                    : ""
                }
              `}
            >
              <img
                src={resolveImageUrl(photo.image)}
                alt=""
                loading="lazy"
                className="w-full h-auto rounded-lg"
              />
            </div>
          );
        })}
      </div>
      {selectedPhoto && !deleteMode && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}
