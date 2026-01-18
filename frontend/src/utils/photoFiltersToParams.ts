import type { PhotoFilters } from "../types/photoFilters";

export function photoFiltersToParams(filters: PhotoFilters) {
  const params: Record<string, string | string[]> = {};
  if (filters.private_only === true) {
    params.private_only = "true";
  }
  if (filters.eventId) {
    params.event = filters.eventId;
  }

  if (filters.eventIds?.length) {
    params.event_ids = filters.eventIds;
  }
  if (filters.startDate && filters.endDate) {
    params.start_date = filters.startDate;
    params.end_date = filters.endDate;
  }
  if (filters.tags?.length) {
    params.tags = filters.tags;
  }
  if (filters.timeline === true) {
    params.timeline = "true";
  }
  if (filters.eventName?.trim()) {
    params.event_name = filters.eventName.trim();
  }

  return params;
}
