import { api } from "./api";
import type { Photo } from "../types/photo";
import type { PhotoFilters } from "../types/photoFilters";
import { photoFiltersToParams } from "../utils/photoFiltersToParams";
import type { TaggedPhoto } from "../types/taggedPhoto";

export const photosApi=api.injectEndpoints({
  endpoints: (builder) => ({
    getPhotos:builder.query<{count:number;results:Photo[]},PhotoFilters>({
      query: (filters) => {
        const params=photoFiltersToParams(filters);
        return {
          url:"/photos/",
          params,
        };
      },
      providesTags: (result) =>
        result?.results?[...result.results.map((photo) => ({
                type:"Photos" as const,
                id:photo.id,
              })),
              {type:"Photos",id:"LIST"},
            ]
          :[{type:"Photos",id:"LIST"}],
    }),
    getPhotoComments: builder.query<any[],string>({
      query: (photoId) => `/photos/${photoId}/comments/`,
      providesTags:["PhotoComments"],
    }),
    toggleLike: builder.mutation<{ liked:boolean },string>({
      query: (photoId) => ({
        url:`/photos/${photoId}/like/`,
        method:"POST",
      }),
      invalidatesTags:["Photos","Dashboard"],
    }),
    addComment: builder.mutation<{ id: string; created_at: string },{ photoId: string; text: string; parentId?: string }>({
      query: ({photoId,text,parentId }) => ({
        url:`/photos/${photoId}/comment/`,
        method:"POST",
        body:{
          text,
          parent_id:parentId,
        },
      }),
      invalidatesTags:["PhotoComments"],
    }),
    toggleFavourite: builder.mutation<{favourited:boolean},string>({
      query: (photoId) => ({
        url:`/photos/${photoId}/favourite/`,
        method:"POST",
      }),
      invalidatesTags:["Favourites"],
    }),
    tagUserOnPhoto: builder.mutation<{photo_id:string;tagged_user:string;tagged_at:string},{photoId:string;userId:string}>({
      query: ({photoId,userId}) => ({
        url:`/photos/${photoId}/tag/`,
        method:"POST",
        body:{
          user_id:userId,
        },
      }),
      invalidatesTags:["Photos","TaggedPhotos"],
    }),
    getFavouritePhotos: builder.query<{id:string;image:string}[],void>({
      query: () => "/photos/favourites/",
      providesTags:["Favourites"],
    }),
    getTaggedPhotos: builder.query<TaggedPhoto[],void>({
      query: () => "/photos/tagged/",
      providesTags:["TaggedPhotos"],
    }),
    bulkUploadPhotos: builder.mutation<{uploaded:number},{eventId:string;files:File[]}>({
      query: ({ eventId, files }) => {
        const formData=new FormData();
        formData.append("event",eventId);
        files.forEach((file) => {
          formData.append("images",file);
        });
        return{
          url:"/photos/bulk/",
          method:"POST",
          body:formData,
        };
      },
      invalidatesTags:[
        {type:"Photos",id:"LIST"},
        "Dashboard",
      ],
    }),
    getPhotographerDashboard:builder.query<
      {
        total_uploads:number;
        total_views:number;
        total_likes:number;
        total_downloads:number;
        events:{
          event_id:string;
          event_name:string;
          photo_count:number;
          views:number;
          downloads:number;
          likes:number;
        }[];
      },
      void
    >({
      query: () => "/photos/dashboard/",
      providesTags:["Dashboard"],
    }),
    bulkDeletePhotos: builder.mutation<{deleted:number},{photoIds:string[]}>({
      query: (body) => ({
        url:"/photos/bulk-delete/",
        method:"POST",
        body,
      }),
      invalidatesTags:["Photos", "Dashboard"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPhotosQuery,
  useGetPhotoCommentsQuery,
  useAddCommentMutation,
  useToggleLikeMutation,
  useToggleFavouriteMutation,
  useTagUserOnPhotoMutation,
  useGetFavouritePhotosQuery,
  useGetTaggedPhotosQuery,
  useBulkUploadPhotosMutation,
  useGetPhotographerDashboardQuery,
  useBulkDeletePhotosMutation,
}=photosApi;
