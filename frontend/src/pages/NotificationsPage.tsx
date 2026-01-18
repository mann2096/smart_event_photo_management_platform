import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
} from "../services/notificationsApi";

function formatNotification(n: any) {
  const p = n?.payload ?? {};
  const actorName =
    p.actor?.user_name ??
    p.tagged_by?.user_name ??
    p.uploaded_by?.user_name ??
    p.commented_by?.user_name ??
    p.replied_by?.user_name ??
    p.liked_by?.user_name ??
    p.commented_by ??
    p.liked_by ??
    "Someone";

  switch (n.type) {
    case "tagged":
      return (
        <>
          <span className="font-medium">{actorName}</span>{" "}
          tagged you in a photo from{" "}
          <span className="font-medium">
            {p.event_name ?? "an event"}
          </span>
        </>
      );
    case "comment":
      return (
        <>
          <span className="font-medium">{actorName}</span>{" "}
          commented on your photo
        </>
      );
    case "reply":
      return (
        <>
          <span className="font-medium">{actorName}</span>{" "}
          replied to your comment
        </>
      );
    case "photo_like":
      return (
        <>
          <span className="font-medium">{actorName}</span>{" "}
          liked your photo
        </>
      );
    case "bulk_upload":
      return (
        <>
          <span className="font-medium">{actorName}</span>{" "}
          uploaded{" "}
          <span className="font-medium">
            {p.photo_count ?? 0}
          </span>{" "}
          new photos to{" "}
          <span className="font-medium">
            {p.event_name ?? "an event"}
          </span>
        </>
      );
    default:
      return <>You have a new notification</>;
  }
}



export default function NotificationsPage() {
  const { data: notifications, isLoading } =
    useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading notifications…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6">
        Notifications
      </h2>

      {notifications?.length === 0 && (
        <p className="text-gray-500 text-sm">
          No notifications yet
        </p>
      )}

      <div className="space-y-3">
        {notifications?.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              if (!n.is_read) {
                markRead(n.id);
              }
            }}
            className={`cursor-pointer rounded-lg border p-4 transition
              ${
                n.is_read
                  ? "bg-gray-50 border-gray-200"
                  : "bg-white border-blue-300 shadow-sm hover:bg-blue-50"
              }`}
          >
            <div className="flex items-start justify-between">
              <div className="text-sm text-gray-800">
                {formatNotification(n)}
              </div>

              {!n.is_read && (
                <span className="ml-3 h-2 w-2 rounded-full bg-blue-500 mt-1" />
              )}
            </div>

            <div className="mt-2 text-xs text-gray-500">
              {new Date(n.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
