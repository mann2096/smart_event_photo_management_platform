import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const api=createApi({
  reducerPath:"api",
  baseQuery:baseQueryWithReauth,
  tagTypes:["PhotoComments","Photos","Favourites","Notifications","TaggedPhotos","Dashboard","Events","EventParticipants","Me"],
  endpoints: () => ({}),
});
