import type { Photo } from "./photo";

export type TaggedPhoto = {
  photo: Photo;
  tagged_at: string;
  tagged_by?: {
    id: string;
    user_name: string;
    email: string;
  } | null;
};
