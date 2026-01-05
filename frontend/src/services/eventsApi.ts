import {api} from "./api";
import type {Event} from "../types/event";

export const eventsApi=api.injectEndpoints({
  endpoints:(builder) => ({
    getEvents: builder.query<{results:Event[]},void>({
      query: () => "/events/",
      providesTags:["Events"],
    }),
    getPublicEvents: builder.query<Event[],void>({
      query: () => "/events/public/",
    }),
    getEventParticipants: builder.query<{user_id:string;user_name:string;role:string}[],string>({
      query: (eventId) => `/events/${eventId}/participants/`,
      providesTags: (result,error,eventId) => [
        {type:"EventParticipants",id:eventId},
      ],
    }),
    createEvent: builder.mutation<Event, Partial<Event>>({
      query: (data) => ({
        url: "/events/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Events"],
    }),
    changeEventRole: builder.mutation<{status:string},{eventId:string;userId:string;role:string}>({
      query: ({ eventId, userId, role }) => ({
        url: `/events/${eventId}/roles/`,
        method: "PATCH",
        body: {
          user_id: userId,
          role,
        },
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: "EventParticipants", id: eventId },
      ],
    }),
    getMyEventRole: builder.query<{ role: string | null },string>({
      query: (eventId) => `/events/${eventId}/my-role/`,
    }),
  }),
});

export const {useGetEventsQuery}=eventsApi;
export const { 
  useGetPublicEventsQuery,
  useGetEventParticipantsQuery,
  useCreateEventMutation,
  useChangeEventRoleMutation,
  useGetMyEventRoleQuery,}=eventsApi;

