import type { PhotoFilters } from "../types/photoFilters";

export function photoFiltersToParams(filters:PhotoFilters){
  const params:Record<string,string|string[]>={};
  if(filters.private_only){
    params.private_only="true";
    return params;
  }
  if(filters.eventId){
    params.event=filters.eventId;
    return params;
  }
  if(filters.eventIds && filters.eventIds.length > 0){
    params.event_ids=filters.eventIds;
  }
  if(filters.startDate && filters.endDate){
    params.start_date=filters.startDate;
    params.end_date=filters.endDate;
  }
  if(filters.tags.length > 0){
    params.tags=filters.tags;
  }
  if(filters.eventName.trim()){
    params.event_name=filters.eventName.trim();
  }
  if(filters.timeline){
    params.timeline="true";
  }
  return params;
}
