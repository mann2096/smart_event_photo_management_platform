import { useParams } from "react-router-dom";
import {
  useGetEventParticipantsQuery,
  useChangeEventRoleMutation,
  useGetEventByIdQuery,
  useUpdateEventMutation,
} from "../services/eventsApi";
import { useAppSelector } from "../app/hooks";
import { useEffect, useState } from "react";
import type { Event } from "../types/event";
import { useCreateEventInviteMutation } from "../services/eventsApi";

const ROLES = ["member", "photographer", "coordinator"] as const;

export default function ManageEventPage() {
  const [createInvite, { isLoading: inviteLoading }] =
    useCreateEventInviteMutation();

  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const { eventId } = useParams<{ eventId: string }>();
  if (!eventId) return null;

  const currentUser = useAppSelector((s) => s.auth.user);
  const isSuperuser = currentUser?.is_superuser === true;
  const { data: event, isLoading: eventLoading } =
    useGetEventByIdQuery(eventId);

  const [updateEvent, { isLoading: savingEvent }] =
    useUpdateEventMutation();

  const [form, setForm] = useState<Partial<Event>>({});

  useEffect(() => {
    if (event) {
      setForm({
        name: event.name,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        visibility: event.visibility,
      });
    }
  }, [event]);
  const { data: participants = [], isLoading: loadingParticipants } =
    useGetEventParticipantsQuery(eventId);

  const [changeRole, { isLoading: updatingRole }] =
    useChangeEventRoleMutation();

  const canEditEvent =
    isSuperuser ||
    participants.some(
      (p) => p.user_id === currentUser?.id && p.role === "coordinator"
    );
    if (!canEditEvent) {
      return (
        <div className="p-6 text-sm text-gray-500">
          You do not have permission to manage this event.
        </div>
      );
    }
  const handleCreateInvite = async () => {
    try {
      const res = await createInvite(eventId).unwrap();
      setInviteLink(res.invite_link);
    } catch {
      alert("Failed to create invite");
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied");
  };

  const handleSaveEvent = async () => {
    try {
      await updateEvent({
        eventId,
        data: form,
      }).unwrap();

      alert("Event details updated successfully");
    } catch {
      alert("Failed to update event");
    }
  };

  if (eventLoading || loadingParticipants) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Event not found
      </div>
    );
  }
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h2 className="text-2xl font-semibold">
        Manage Event
      </h2>
      <div className="rounded-xl border bg-white p-6 space-y-4">
        <h3 className="text-lg font-medium">
          Event details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={form.name || ""}
            disabled={!canEditEvent}
            onChange={(e) =>
              setForm((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="Event name"
            className="rounded-lg border px-3 py-2 text-sm"
          />

          <select
            value={form.visibility}
            disabled={!canEditEvent}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                visibility: e.target.value as "public" | "private",
              }))
            }
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>

          <input
            type="date"
            value={form.start_date || ""}
            disabled={!canEditEvent}
            onChange={(e) =>
              setForm((f) => ({ ...f, start_date: e.target.value }))
            }
            className="rounded-lg border px-3 py-2 text-sm"
          />

          <input
            type="date"
            value={form.end_date || ""}
            disabled={!canEditEvent}
            onChange={(e) =>
              setForm((f) => ({ ...f, end_date: e.target.value }))
            }
            className="rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <textarea
          value={form.description || ""}
          disabled={!canEditEvent}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              description: e.target.value,
            }))
          }
          placeholder="Event description"
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />

        {canEditEvent && (
          <button
            onClick={handleSaveEvent}
            disabled={savingEvent}
            className="px-4 py-2 rounded-lg bg-blue-600
                       text-white text-sm hover:bg-blue-700
                       disabled:opacity-50"
          >
            Save changes
          </button>
        )}
      </div>
      {canEditEvent && (
        <div className="rounded-xl border bg-white p-6 space-y-3">
          <h3 className="text-lg font-medium">
            Invite link
          </h3>

          {!inviteLink ? (
            <button
              onClick={handleCreateInvite}
              disabled={inviteLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white
                        text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {inviteLoading ? "Creating…" : "Create invite link"}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <input
                value={inviteLink}
                readOnly
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              />

              <button
                onClick={handleCopyInvite}
                className="px-4 py-2 rounded-lg border text-sm"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}
      <div className="rounded-xl border bg-white">
        <h3 className="px-4 py-3 font-medium border-b">
          Participants
        </h3>

        {participants.map((p) => (
          <div
            key={p.user_id}
            className="flex items-center justify-between
                       px-4 py-3 border-b last:border-b-0"
          >
            <div>
              <p className="font-medium">{p.user_name}</p>
              <p className="text-xs text-gray-500">
                {p.user_id}
              </p>
            </div>

            <select
              value={p.role}
              disabled={!canEditEvent || updatingRole}
              onChange={(e) =>
                changeRole({
                  eventId,
                  userId: p.user_id,
                  role: e.target.value,
                })
              }
              className="rounded-lg border px-3 py-2 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
