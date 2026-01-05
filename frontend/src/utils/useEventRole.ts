import { useGetMyEventRoleQuery } from "../services/eventsApi";

export function useEventRole(eventId:string){
  const {data,isLoading,isError }=useGetMyEventRoleQuery(eventId);
  return{
    role:data?.role ?? null,
    isLoading,
    isError,
  };
}
