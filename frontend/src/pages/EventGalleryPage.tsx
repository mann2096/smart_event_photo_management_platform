import {useParams } from "react-router-dom";
import { useState } from "react";
import { useGetPhotosQuery } from "../services/photosApi";
import type { Photo } from "../types/photo";
import UploadPhotosPanel from "../components/UploadPhotosPanel";
import PhotoModal from "../components/PhotoModal";
import { useAppSelector } from "../app/hooks";
import { useEventRole } from "../utils/useEventRole";

export default function EventGalleryPage() {
  const { eventId }=useParams<{eventId:string}>();
  const safeEventId=eventId??"";
  const{role,isLoading:roleLoading,isError:roleError,}=useEventRole(safeEventId);
  const isSuperuser=useAppSelector((state) => state.auth.user?.is_superuser);
  const canUpload=role==="photographer"||role==="coordinator"||isSuperuser===true;
  const [selectedPhoto,setSelectedPhoto]=useState<Photo|null>(null);
  const{data:photosResponse,isLoading,isError,}=useGetPhotosQuery({
    eventId:safeEventId,
    eventName:"",
    tags:[],
    timeline:true,
    startDate:undefined,
    endDate:undefined,
  });
  if (!eventId){
    return <p>Invalid event</p>;
  }
  if (isLoading){
    return <p>Loading photos...</p>;
  }
  if (isError){
    return <p>Failed to load photos</p>;
  }
  const photos:Photo[]=Array.isArray(photosResponse)?photosResponse:photosResponse?.results??[];
  return (
    <div>
      <h2>Event Gallery</h2>
      {canUpload && <UploadPhotosPanel eventId={eventId} />}
      <div style={{display:"flex",flexWrap:"wrap"}}>
        {photos.map((photo) => (
          <img key={photo.id} src={photo.image} width={200} onClick={() => setSelectedPhoto(photo)}/>))}
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
