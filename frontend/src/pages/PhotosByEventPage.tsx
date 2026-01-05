import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetPhotosQuery } from "../services/photosApi";
import type { Photo } from "../types/photo";
import PhotoModal from "../components/PhotoModal";

export default function PhotosByEventPage(){
  const [selectedPhoto,setSelectedPhoto]=useState<Photo|null>(null);
  const {data,isLoading}=useGetPhotosQuery({
    private_only:true,
    timeline:true,
    tags:[],
    eventName:"",
  } as any);
  if (isLoading) return <p>Loading photos...</p>;
  const photos:Photo[]=data?.results??[];
  const grouped=photos.reduce<Record<string,Photo[]>>((acc, photo) => {
    const eventId=photo.event.id;
    if (!acc[eventId]) acc[eventId]=[];
    acc[eventId].push(photo);
    return acc;
  },{});
  return(
    <div>
      <h2>Your Events</h2>
      {Object.entries(grouped).map(([eventId,eventPhotos]) => (
        <div key={eventId} style={{marginBottom:32}}>
          <h3>{eventPhotos[0].event.name}</h3>
          <Link to={`/events/${eventId}`}>Open Even</Link>
          <div style={{display:"flex",flexWrap:"wrap"}}>
            {eventPhotos.map((photo) => (
              <img key={photo.id} src={photo.image} width={180} style={{margin:6,cursor:"pointer"}} onClick={() => setSelectedPhoto(photo)}/>
            ))}
          </div>
        </div>
      ))}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}
