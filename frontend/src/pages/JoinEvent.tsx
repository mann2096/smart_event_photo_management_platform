import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { useJoinEventMutation } from "../services/eventsApi";

export default function JoinEvent() {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();

  const isAuthenticated = useAppSelector(
    (state) => state.auth.isAuthenticated
  );
  const [joinEvent] = useJoinEventMutation();
  useEffect(() => {
        if (!inviteId) {
        navigate("/login");
        return;
        }
        if (!isAuthenticated) {
        navigate(`/login?next=/join-event/${inviteId}`);
        return;
        }
        joinEvent(inviteId)
        .unwrap()
        .then((res) => {
            navigate(`/events/${res.event_id}`);
        })
        .catch(() => {
            alert("Invite invalid or expired");
            navigate("/events");
        });
    }, [inviteId, isAuthenticated, navigate, joinEvent]);

    return (
        <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Joining event…
        </div>
    );
    }
