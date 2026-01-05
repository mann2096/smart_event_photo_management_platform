import { useGetPhotographerDashboardQuery } from "../services/photosApi";

export default function PhotographerDashboardPage(){
  const {data,isLoading}=useGetPhotographerDashboardQuery();
  if (isLoading) return <p>Loading dashboard...</p>;
  if (!data) return <p>No data available</p>;
  return(
    <div>
      <h2>Photographer Dashboard</h2>
      <div>
        <p>Total uploads: {data.total_uploads}</p>
        <p>Total views: {data.total_views}</p>
        <p>Total likes: {data.total_likes}</p>
        <p>Total downloads: {data.total_downloads}</p>
      </div>
      <h3>Per Event</h3>
      {data.events.map((event) => (
        <div key={event.event_id}>
          <h4>{event.event_name}</h4>
          <p>Photos: {event.photo_count}</p>
          <p>Views: {event.views}</p>
          <p>Likes: {event.likes}</p>
          <p>Downloads: {event.downloads}</p>
        </div>
      ))}
    </div>
  );
}
