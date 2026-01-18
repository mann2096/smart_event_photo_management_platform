import { Link } from "react-router-dom";
import { useGetEventsQuery } from "../services/eventsApi";
import type { Event } from "../types/event";

export default function EventsPage() {
  const {
    data,
    isLoading,
    isError,
  } = useGetEventsQuery();

  const events: Event[] = data?.results ?? [];
  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading events…
      </div>
    );
  }
  if (isError) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Failed to load events
      </div>
    );
  }
  if (events.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        <h2 className="text-2xl font-semibold">Events</h2>
        <p className="text-sm text-gray-500">
          No events created yet.
        </p>

        <Link
          to="/events/create"
          className="inline-block px-4 py-2 rounded-lg
                     bg-blue-600 text-white
                     text-sm font-medium hover:bg-blue-700 transition"
        >
          Create your first event
        </Link>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Events
        </h2>

        <Link
          to="/events/create"
          className="px-4 py-2 rounded-lg
                     bg-blue-600 text-white
                     text-sm font-medium
                     hover:bg-blue-700 transition"
        >
          Create Event
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className="block rounded-xl border
                       bg-white p-4
                       hover:bg-gray-50 transition"
          >
            <h3 className="text-lg font-medium text-gray-900">
              {event.name}
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              {event.description || "No description"}
            </p>

            <p className="text-xs text-gray-400 mt-2">
              {event.start_date} → {event.end_date}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
