import { useState } from "react";
import { useBulkUploadPhotosMutation } from "../services/photosApi";

type Props={
  eventId: string;
};

export default function UploadPhotosPanel({ eventId }:Props){
  const [files,setFiles]=useState<File[]>([]);
  const [uploadPhotos,{isLoading}]=useBulkUploadPhotosMutation();
  const handleUpload = async () => {
    if (!files.length) return;
    await uploadPhotos({eventId,files}).unwrap();
    setFiles([]);
  };
  return(
    <div>
      <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files||[]))}/>
      <button onClick={handleUpload} disabled={isLoading}>
        Upload
      </button>
    </div>
  );
}
