import { skipToken } from "@reduxjs/toolkit/query";
import { useGetMyEventRoleQuery } from "../services/eventsApi";

export function useEventRole(eventId?: string) {
  const queryArg = eventId ? eventId : skipToken;

  const { data, isLoading, isError } =
    useGetMyEventRoleQuery(queryArg);

  return {
    role: data?.role ?? null,
    isLoading,
    isError,
  };
}
