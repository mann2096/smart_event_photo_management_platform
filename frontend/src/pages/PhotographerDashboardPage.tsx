import { useGetPhotographerDashboardQuery } from "../services/photosApi";

export default function PhotographerDashboardPage() {
  const { data, isLoading } = useGetPhotographerDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        Loading dashboard…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-10">

      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Photographer dashboard
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your photo performance
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Total uploads" value={data.total_uploads} />
        <MetricCard label="Total views" value={data.total_views} />
        <MetricCard label="Total likes" value={data.total_likes} />
        <MetricCard label="Total downloads" value={data.total_downloads} />
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Per event
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.events.map((event) => (
            <div
              key={event.event_id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <h4 className="text-base font-medium text-gray-900">
                {event.event_name}
              </h4>

              <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm text-gray-600">
                <Stat label="Photos" value={event.photo_count} />
                <Stat label="Views" value={event.views} />
                <Stat label="Likes" value={event.likes} />
                <Stat label="Downloads" value={event.downloads} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  );
}
