import { useEffect, useState } from "react";
import type { Photo } from "../types/photo";
import {
  useAddCommentMutation,
  useGetPhotoCommentsQuery,
  useTagUserOnPhotoMutation,
  useToggleFavouriteMutation,
  useToggleLikeMutation,
} from "../services/photosApi";
import { useGetEventParticipantsQuery } from "../services/eventsApi";

type PhotoModalProps={
  photo:Photo;
  onClose: () => void;
};

export default function PhotoModal({photo,onClose}:PhotoModalProps){
  const {data:comments=[],isLoading:commentsLoading}=useGetPhotoCommentsQuery(photo.id);
  const {data:participants=[],isLoading:participantsLoading}=useGetEventParticipantsQuery(photo.event.id);
  const [addComment]=useAddCommentMutation();
  const [toggleLike]=useToggleLikeMutation();
  const [toggleFavourite]=useToggleFavouriteMutation();
  const [tagUserOnPhoto]=useTagUserOnPhotoMutation();
  const [commentText,setCommentText]=useState("");
  const [selectedUserId,setSelectedUserId]=useState("");
  const [tagError,setTagError]=useState<string|null>(null);
  const [showExif,setShowExif]=useState(false);
  return(
    <div>
      <button onClick={onClose}>Close</button>
      <div>
        <img src={photo.image} alt="" width={600} />
      </div>
      <p>Views: {photo.views}</p>
      <div>
        <button onClick={() => toggleLike(photo.id)}>
          Like
        </button>
        <button onClick={() => toggleFavourite(photo.id)}>
          Favourite
        </button>
      </div>
      <div>
        <h4>Comments</h4>
        {commentsLoading && <p>Loading comments...</p>}
        {comments.map((c: any) => (
          <div key={c.id}>
            <p>
              <strong>{c.user}</strong>: {c.text}
            </p>
            {c.replies?.map((r:any) => (
              <p key={r.id} style={{marginLeft:20}}>
                ↳ <strong>{r.user}</strong>: {r.text}
              </p>
            ))}
          </div>
        ))}
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!commentText.trim()) return;
          await addComment({photoId:photo.id,text:commentText,}).unwrap();setCommentText("");}}>
        <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..."/>
        <button type="submit">Post</button>
      </form>
      <div>
        <h4>Tag user</h4>
        {participantsLoading && <p>Loading participants...</p>}
        {!participantsLoading && participants.length>0 && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedUserId) return;
              try{
                await tagUserOnPhoto({photoId:photo.id,userId:selectedUserId,}).unwrap();
                setSelectedUserId("");
                setTagError(null);
              } catch{
                setTagError("User already tagged or invalid");
              }
            }}
          >
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
              <option value="">Select participant</option>
              {participants.map((p: any) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.user_name} ({p.role})
                </option>
              ))}
            </select>
            <button type="submit" disabled={!selectedUserId}>
              Tag
            </button>
          </form>
        )}
        {tagError && <p>{tagError}</p>}
      </div>
      {photo.exif_data && (
        <div>
          <h4>Photo Details</h4>
          <ul>
            {photo.exif_data.camera_model && (
              <li>Camera: {photo.exif_data.camera_model}</li>
            )}
            {photo.exif_data.aperture && (
              <li>Aperture: {photo.exif_data.aperture}</li>
            )}
            {photo.exif_data.shutter_speed && (
              <li>Shutter: {photo.exif_data.shutter_speed}</li>
            )}
            {photo.exif_data.iso && (
              <li>ISO: {photo.exif_data.iso}</li>
            )}
            {photo.exif_data.taken_at && (
              <li>Taken at: {photo.exif_data.taken_at}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
