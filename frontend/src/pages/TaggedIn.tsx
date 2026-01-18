import { useState } from "react";
import { useGetTaggedPhotosQuery } from "../services/photosApi";
import type { Photo } from "../types/photo";
import PhotoModal from "../components/PhotoModal";
import { resolveImageUrl } from "../utils/resolveImageUrl";


export default function TaggedIn() {
  const { data: tagged, isLoading, isError } =
    useGetTaggedPhotosQuery();

  const [selectedPhoto, setSelectedPhoto] =
    useState<Photo | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        Loading tagged photos…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-6 py-6 text-sm text-gray-500">
        Failed to load tagged photos
      </div>
    );
  }

  if (!tagged || tagged.length === 0) {
    return (
      <div className="px-6 py-6 text-sm text-gray-500">
        You are not tagged in any photos yet.
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Photos you’re tagged in
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Photos where other participants tagged you
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tagged.map((tag) => (
          <div
            key={tag.photo.id}
            onClick={() => setSelectedPhoto(tag.photo)}
            className="cursor-pointer rounded-xl border border-gray-200
                       bg-white p-4 hover:shadow-sm transition"
          >
            <img
              src={resolveImageUrl(tag.photo.image)}
              alt=""
              loading="lazy"
              className="w-full aspect-square object-cover rounded-lg"
            />
            <div className="mt-3 space-y-1 text-sm">
              <p className="text-gray-600">
                Tagged on{" "}
                <span className="font-medium text-gray-800">
                  {new Date(tag.tagged_at).toLocaleString()}
                </span>
              </p>

              <p className="text-gray-600">
                Tagged by{" "}
                <span className="font-medium text-gray-800">
                  {tag.tagged_by?.user_name ?? "Unknown user"}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}
