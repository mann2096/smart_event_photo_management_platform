import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
} from "../services/notificationsApi";

export default function NotificationsPage(){
  const {data:notifications,isLoading}=useGetNotificationsQuery();
  const [markRead]=useMarkNotificationReadMutation();
  if (isLoading) return <p>Loading notifications...</p>;
  return (
    <div>
      <h2>Notifications</h2>
      {notifications?.length ===0 && (<p>No notifications</p>)}
      {notifications?.map((n) => (
        <div
          key={n.id}
          onClick={() => {
            if (!n.is_read){
              markRead(n.id);
            }
          }}
          style={{cursor:"pointer",border:"1px solid #ccc",padding:8,marginBottom:8,background: n.is_read?"#f5f5f5":"#fff",}}>
          <p>
            <strong>Type:</strong> {n.type}
          </p>
          <pre>
            {JSON.stringify(n.payload,null,2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
