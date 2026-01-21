import {api} from "./api";
import type {Event} from "../types/event";

export const eventsApi=api.injectEndpoints({
  endpoints:(builder) => ({
    getEvents: builder.query<{results:Event[]},void>({
      query: () => "/events/",
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
    getEventById: builder.query<Event, string>({
      query: (eventId) => `/events/${eventId}/`,
    }),

    updateEvent: builder.mutation<Event,{eventId:string;data:Partial<Event>}>({
      query: ({ eventId, data }) => ({
        url: `/events/${eventId}/`,
        method: "PATCH",
        body: data,
      }),
    }),
    joinEvent: builder.mutation<{status:string;event_id:string},string>({
      query: (inviteId) => ({
        url:`/events/join/${inviteId}/`,
        method:"POST",
      }),
      invalidatesTags: ["Events", "EventParticipants"],
    }),
    createEventInvite: builder.mutation<{invite_link:string;created:boolean},string>({
      query: (eventId) => ({
        url:`/events/${eventId}/invite/`,
        method: "POST",
      }),
    }),
    addEventMemberByEmail:builder.mutation<{status:string;user_id:string;user_name:string},{eventId:string;email:string}>({
      query:({eventId,email}) => ({
        url:`/events/${eventId}/add-member/`,
        method:"POST",
        body:{email},
      }),
      invalidatesTags:(result,error,{eventId}) => [
        {type:"EventParticipants",id:eventId},
      ],
    }),
  }),
});

export const {useGetEventsQuery}=eventsApi;
export const { 
  useGetEventByIdQuery,
  useUpdateEventMutation,
  useGetPublicEventsQuery,
  useGetEventParticipantsQuery,
  useCreateEventMutation,
  useChangeEventRoleMutation,
  useJoinEventMutation,
  useCreateEventInviteMutation,
  useGetMyEventRoleQuery,
  useAddEventMemberByEmailMutation}=eventsApi;

