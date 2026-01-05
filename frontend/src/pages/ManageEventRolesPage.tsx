import { useParams } from "react-router-dom";
import {useGetEventParticipantsQuery,useChangeEventRoleMutation,} from "../services/eventsApi";
import RoleSelect from "../components/RoleSelect";

export default function ManageEventRolesPage(){
  const {eventId}=useParams<{eventId:string}>();
  const {data:participants,isLoading}=useGetEventParticipantsQuery(eventId!);
  const [changeRole]=useChangeEventRoleMutation();
  if (isLoading) return <p>Loading participants...</p>;
  return(
    <div>
      <h2>Manage Event Roles</h2>
      {participants?.map((p) => (
        <div key={p.user_id}>
          <span>{p.user_name}</span>
          <RoleSelect currentRole={p.role} onChange={(newRole) => changeRole({
                eventId: eventId!,
                userId: p.user_id,
                role: newRole,
              })
            }
          />
        </div>
      ))}
    </div>
  );
}
