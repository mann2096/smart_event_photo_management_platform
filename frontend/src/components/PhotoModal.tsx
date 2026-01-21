import { useEffect, useRef, useState } from "react";
import type { Photo } from "../types/photo";
import {
  useAddCommentMutation,
  useGetPhotoCommentsQuery,
  useTagUserOnPhotoMutation,
  useToggleFavouriteMutation,
  useToggleLikeMutation,
  useRecordViewMutation,
  useGetPhotoByIdQuery,
} from "../services/photosApi";
import { useGetEventParticipantsQuery } from "../services/eventsApi";
import { resolveImageUrl } from "../utils/resolveImageUrl";
import PhotoExif from "./PhotoExif";
import { downloadWatermarkedPhoto } from "../utils/downloadPhoto";

type PhotoModalProps={
  photo:Photo|null;
  onClose: () =>void;
};

type CommentType={
  id:string;
  user:string;
  text:string;
  parent:string | null;
  replies:CommentType[];
};

export default function PhotoModal({ photo, onClose }: PhotoModalProps) {
  if (!photo) return null;
  const photoId = photo.id;
  const eventId = photo.event?.id ?? null;
  const [recordView] = useRecordViewMutation();
  const viewedRef = useRef(false);

  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    recordView(photoId);
  }, [photoId, recordView]);
  const { data: freshPhoto } = useGetPhotoByIdQuery(photoId);
  const displayPhoto = freshPhoto ?? photo;
  const { data: comments = [] } =
    useGetPhotoCommentsQuery(photoId);
  const { data: participants = [] } =
    useGetEventParticipantsQuery(eventId!, { skip: !eventId });
  const [likesCount, setLikesCount] = useState(
    displayPhoto.likes_count ?? 0
  );
  const [liked, setLiked] = useState(
    displayPhoto.liked_by_me ?? false
  );
  const [favourited, setFavourited] = useState(
    displayPhoto.favourited_by_me ?? false
  );

  useEffect(() => {
    setLikesCount(displayPhoto.likes_count ?? 0);
    setLiked(displayPhoto.liked_by_me ?? false);
    setFavourited(displayPhoto.favourited_by_me ?? false);
  }, [displayPhoto]);
  const [toggleLike] = useToggleLikeMutation();
  const [toggleFavourite] = useToggleFavouriteMutation();

  const handleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    setLikesCount((c) => (prev ? c - 1 : c + 1));

    try {
      await toggleLike(photoId).unwrap();
    } catch {
      setLiked(prev);
      setLikesCount((c) => (prev ? c + 1 : c - 1));
    }
  };

  const handleFavourite = async () => {
    const prev = favourited;
    setFavourited(!prev);

    try {
      await toggleFavourite(photoId).unwrap();
    } catch {
      setFavourited(prev);
    }
  };
  const [addComment] = useAddCommentMutation();
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyTo, setReplyTo] = useState<CommentType | null>(null);

  const postComment = async () => {
    if (!commentText.trim()) return;
    await addComment({ photoId, text: commentText }).unwrap();
    setCommentText("");
  };

  const postReply = async () => {
    if (!replyText.trim() || !replyTo) return;
    await addComment({
      photoId,
      text: replyText,
      parentId: replyTo.id,
    }).unwrap();
    setReplyText("");
    setReplyTo(null);
  };
  const [selectedUserId, setSelectedUserId] = useState("");
  const [tagUserOnPhoto, { isLoading: tagging }] =
    useTagUserOnPhotoMutation();

  const handleTagUser = async () => {
    if (!selectedUserId) return;
    await tagUserOnPhoto({
      photoId,
      userId: selectedUserId,
    }).unwrap();
    setSelectedUserId("");
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-white rounded-xl max-w-6xl w-full h-[90vh] flex overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xl"
        >
          ✕
        </button>
        <div className="flex-1 bg-black flex items-center justify-center">
          <img
            src={resolveImageUrl(displayPhoto.image)}
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <div className="w-[380px] border-l flex flex-col">
          <div className="px-4 py-3 border-b flex gap-4 text-sm">
            <button onClick={handleLike} className="text-blue-600">
              {liked ? "Liked" : "Like"}
            </button>

            <span>{likesCount} likes</span>

            <button
              onClick={handleFavourite}
              className="text-yellow-600"
            >
              {favourited ? "Favourited ⭐" : "Favourite"}
            </button>

            <button
              onClick={async () => {
                try {
                  await downloadWatermarkedPhoto(photoId);
                } catch {
                  alert("Failed to download image");
                }
              }}
              className="font-medium text-green-600"
            >
              Download
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-sm">
            {(comments as CommentType[]).map((c) => (
              <div key={c.id} className="space-y-1">
                <p>
                  <strong>{c.user}</strong> {c.text}
                </p>

                <button
                  className="text-xs text-blue-600"
                  onClick={() => setReplyTo(c)}
                >
                  Reply
                </button>

                {c.replies.length > 0 && (
                  <div className="ml-4 space-y-1 border-l pl-3">
                    {c.replies.map((r) => (
                      <p key={r.id}>
                        <strong>{r.user}</strong> {r.text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="border-t p-3 space-y-2">
            {replyTo && (
              <div className="text-xs text-gray-500">
                Replying to <strong>{replyTo.user}</strong>{" "}
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-red-500 ml-2"
                >
                  cancel
                </button>
              </div>
            )}

            <textarea
              value={replyTo ? replyText : commentText}
              onChange={(e) =>
                replyTo
                  ? setReplyText(e.target.value)
                  : setCommentText(e.target.value)
              }
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder={
                replyTo ? "Write a reply…" : "Add a comment…"
              }
            />

            <button
              onClick={replyTo ? postReply : postComment}
              className="text-blue-600 text-sm font-medium"
            >
              Post
            </button>
          </div>
          {participants.length > 0 && (
            <div className="border-t p-3 space-y-2 text-sm">
              <div className="font-medium">Tag someone in this photo</div>

              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select a participant</option>
                {participants.map((p) => (
                  <option key={p.user_id} value={p.user_id}>
                    {p.user_name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleTagUser}
                disabled={!selectedUserId || tagging}
                className="text-blue-600 text-sm font-medium disabled:opacity-50"
              >
                {tagging ? "Tagging…" : "Tag user"}
              </button>
            </div>
          )}

          {displayPhoto.exif_data && (
            <div className="border-t p-3">
              <PhotoExif exif={displayPhoto.exif_data} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
