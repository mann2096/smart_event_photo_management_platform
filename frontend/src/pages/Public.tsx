import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetPublicEventsQuery } from "../services/eventsApi";
import { useGetPhotosQuery } from "../services/photosApi";
import type { PhotoFilters } from "../types/photoFilters";
import { groupPhotosByEvent } from "../utils/groupPhotosByEvent";

export default function Public(){
  const [filters,setFilters]=useState<PhotoFilters>({
    startDate:undefined,
    endDate:undefined,
    tags:[],
    eventName:"",
    timeline:false,
  });
  const{data: publicEvents,isLoading:eventsLoading,}=useGetPublicEventsQuery();
  const eventIds=Array.isArray(publicEvents)?publicEvents.map((e) => e.id):[];
  const{
    data:photosResponse,
    isLoading:photosLoading,
  }=useGetPhotosQuery({...filters,eventIds,} as any);
  if(eventsLoading||photosLoading){
    return <p>Loading public photos...</p>;
  }
  const photos=photosResponse?.results??[];
  const grouped=groupPhotosByEvent(photos);
  return(
    <>
      {Object.keys(grouped).length===0 && (
        <p>No public photos available.</p>
      )}
      {Object.entries(grouped).map(([eventId,eventPhotos]) => (
        <div key={eventId} style={{ marginBottom:24 }}>
          <h3>Public Event</h3>
          <Link to={`/events/${eventId}`}>View public gallery</Link>
          <div style={{ marginTop:8}}>
            {eventPhotos.slice(0,5).map((photo)=>(
              <img key={photo.id} src={photo.image} width={150} style={{marginRight:8}} alt=""/>))}
          </div>
        </div>
      ))}
    </>
  );
}
