import type { PhotoFilters } from "../types/photoFilters";

export function syncFiltersToUrl(
  filters: PhotoFilters,
  navigate: (url: string, options?: { replace?: boolean }) => void
) {
  const params = new URLSearchParams();

  if (filters.startDate) params.set("start", filters.startDate);
  if (filters.endDate) params.set("end", filters.endDate);

  if (filters.tags.length > 0) {
    params.set("tags", filters.tags.join(","));
  }

  if (filters.eventName.trim()) {
    params.set("event", filters.eventName.trim());
  }

  if (filters.timeline) {
    params.set("timeline", "1");
  }

  const query = params.toString();
  navigate(query ? `?${query}` : "", { replace: true });
}
