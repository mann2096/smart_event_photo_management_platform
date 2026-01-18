import type { PhotoFilters } from "../types/photoFilters";

export function filtersFromUrl(search: string): PhotoFilters {
  const params = new URLSearchParams(search);

  return {
    startDate: params.get("start") || undefined,
    endDate: params.get("end") || undefined,

    tags: params.get("tags")
      ? params.get("tags")!.split(",").filter(Boolean)
      : [],

    eventName: params.get("event") || "",
    timeline: params.get("timeline") === "1",

    private_only: undefined,
  };
}
