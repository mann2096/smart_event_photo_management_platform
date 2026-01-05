import { useState } from "react";
import { useGetEventParticipantsQuery } from "../services/eventsApi";
import { useTagUserOnPhotoMutation } from "../services/photosApi";

type Props={
  eventId:string;
  photoId:string;
};

export default function TagUserDropdown({eventId,photoId}:Props){
  const {data,isLoading}=useGetEventParticipantsQuery(eventId);
  const [tagUser]=useTagUserOnPhotoMutation();
  const [selectedUser,setSelectedUser]=useState("");
  if (isLoading) return <p>Loading participants...</p>;
  if (!data) return null;
  const handleTag = async () => {
    if (!selectedUser) return;
    try{
      await tagUser({photoId,userId:selectedUser,}).unwrap();
      alert("User tagged successfully");
      setSelectedUser("");
    } catch (err){
      alert("User already tagged or error occurred");
    }
  };
  return(
    <div>
      <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
        <option value="">Select participant</option>
        {data.map((p) => (
          <option key={p.user_id} value={p.user_id}>
            {p.user_name} ({p.role})
          </option>
        ))}
      </select>
      <button onClick={handleTag} disabled={!selectedUser}>
        Tag User
      </button>
    </div>
  );
}
