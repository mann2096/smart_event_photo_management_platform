import { Link } from "react-router-dom";
import { useGetEventsQuery } from "../services/eventsApi";

export default function EventsPage(){
    const {data,isLoading}=useGetEventsQuery();
    const events=data?.results??[];
  if (isLoading) return <p>Loading events...</p>;
  return (
    <div>
      <h2>My Events</h2>
      <Link to="/events/create">
        <button>Create Event</button>
      </Link>
      {events?.length ===0 && <p>No events yet</p>}
      <ul>
        {events?.map((event) => (
          <li key={event.id}>
            <Link to={`/events/${event.id}`}>
              {event.name} ({event.visibility})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
