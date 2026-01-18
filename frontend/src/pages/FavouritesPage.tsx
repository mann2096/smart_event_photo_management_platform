import { useState } from "react";
import { useGetFavouritePhotosQuery } from "../services/photosApi";
import { useToggleFavouriteMutation } from "../services/photosApi";
import PhotoModal from "../components/PhotoModal";
import type { Photo } from "../types/photo";

export default function FavouritesPage() {
  const { data: photos, isLoading, error } =
    useGetFavouritePhotosQuery();

  const [toggleFavourite] = useToggleFavouriteMutation();
  const [selectedPhoto, setSelectedPhoto] =
    useState<Photo | null>(null);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        Loading favourites…
      </div>
    );
  }
  if (error) {
    return (
      <div className="px-6 py-6 text-sm text-gray-500">
        Failed to load favourites
      </div>
    );
  }
  if (!photos || photos.length === 0) {
    return (
      <div className="px-6 py-6 text-sm text-gray-500">
        No favourite photos yet.
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Favourites
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Photos you’ve marked as favourites
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.image}
              alt="Favourite"
              loading="lazy"
              className="w-full aspect-square object-cover rounded-lg
                         transition group-hover:brightness-90"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavourite(photo.id);
              }}
              className="absolute top-2 right-2 rounded-full bg-white/90
                         px-2 py-1 text-xs font-medium text-gray-700
                         shadow hover:bg-white"
            >
              Remove
            </button>
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
