import { useState, useRef } from "react";
import { useBulkUploadPhotosMutation } from "../services/photosApi";

type Props={
  eventId:string;
};

export default function BulkPhotoUploader({ eventId }: Props) {
  const [files,setFiles]=useState<File[]>([]);
  const [isDragging,setIsDragging]=useState(false);
  const inputRef=useRef<HTMLInputElement | null>(null);
  const [uploadPhotos, { isLoading }] =
    useBulkUploadPhotosMutation();
  const addFiles=(newFiles:File[]) => {
    const images=newFiles.filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...images]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };
  const handleUpload=async () => {
    if (files.length===0) return;
    try {
      await uploadPhotos({
        eventId,
        files,
      }).unwrap();

      setFiles([]);
      alert("Photos uploaded successfully");
    } catch {
      alert("Upload failed. Try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8
          text-center transition ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white"
          }`}
      >
        <p className="text-sm font-medium text-gray-700">
          Drag & drop photos here
        </p>
        <p className="text-xs text-gray-500 mt-1">
          or click to select files (100+ supported)
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          hidden
          onChange={(e) =>
            addFiles(Array.from(e.target.files ?? []))
          }
        />
      </div>
      {files.length > 0 && (
        <p className="text-sm text-gray-600">
          {files.length} photo(s) selected
        </p>
      )}
      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={isLoading || files.length === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium
                     text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Uploading…" : "Upload photos"}
        </button>

        {files.length > 0 && (
          <button
            onClick={() => setFiles([])}
            className="text-sm text-gray-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
