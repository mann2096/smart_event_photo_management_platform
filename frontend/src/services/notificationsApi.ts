import { api } from "./api";
import type { Notification } from "../types/notification";

export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<Notification[],void>({
      query: () => "/notifications/",
      providesTags:["Notifications"],
    }),
    markNotificationRead: builder.mutation<{ status: string },string>({
      query: (notificationId) => ({
        url:`/notifications/${notificationId}/read/`,
        method:"POST",
      }),
      invalidatesTags:["Notifications"],
    }),
  }),
  overrideExisting:false,
});

export const{
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
}=notificationsApi;
