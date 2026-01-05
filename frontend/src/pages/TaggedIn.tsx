import { useState } from "react";
import { useGetTaggedPhotosQuery } from "../services/photosApi";
import type { Photo } from "../types/photo";
import PhotoModal from "../components/PhotoModal";

export default function TaggedIn(){
  const {data:tagged,isLoading,isError}=useGetTaggedPhotosQuery();
  const [selectedPhoto,setSelectedPhoto]=useState<Photo|null>(null);
  if (isLoading) return <p>Loading tagged photos...</p>;
  if (isError) return <p>Failed to load tagged photos</p>;
  if (!tagged||tagged.length===0){
    return <p>You are not tagged in any photos yet.</p>;
  }
  return(
    <div>
      <h2>Photos You Are Tagged In</h2>
      {tagged.map((tag) => (
        <div key={tag.photo.id} style={{border:"1px solid #ccc",padding:8,marginBottom:16,cursor:"pointer",}}onClick={() => setSelectedPhoto(tag.photo)}>
          <img src={tag.photo.image} alt="" width={300}/>
          <p>
            Tagged on:{" "}
            {new Date(tag.tagged_at).toLocaleString()}
          </p>
          <p>
            Tagged by:{" "}
            <strong>{tag.tagged_by.user_name}</strong>
          </p>
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
