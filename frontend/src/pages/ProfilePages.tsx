import { useState } from "react";
import {
  useGetMeQuery,
  useUpdateProfileMutation,
} from "../features/auth/authApi";
import { resolveImageUrl } from "../utils/resolveImageUrl";

export default function ProfilePage() {
  const { data: user, isLoading, refetch } = useGetMeQuery();
  const [updateProfile, { isLoading: saving }] =
    useUpdateProfileMutation();

  const [form, setForm] = useState({
    user_name: "",
    bio: "",
    batch: "",
    department: "",
    profile_photo: null as File | null,
  });

  if (isLoading || !user) {
    return <p className="p-6 text-sm text-gray-500">Loading profile…</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData();

    if (form.user_name && form.user_name !== user.user_name) {
      fd.append("user_name", form.user_name);
    }
    if (form.bio && form.bio !== user.bio) {
      fd.append("bio", form.bio);
    }
    if (form.batch && form.batch !== user.batch) {
      fd.append("batch", form.batch);
    }
    if (form.department && form.department !== user.department) {
      fd.append("department", form.department);
    }
    if (form.profile_photo) {
      fd.append("profile_photo", form.profile_photo);
    }

    if (Array.from(fd.keys()).length === 0) {
      alert("No changes to save");
      return;
    }

    await updateProfile(fd).unwrap();
    await refetch();
    setForm((f) => ({ ...f, profile_photo: null }));

    alert("Profile updated");
  };
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Your Profile</h2>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-full overflow-hidden border bg-gray-100">
          {user.profile_photo ? (
           <img
            src={`${resolveImageUrl(user.profile_photo)}?t=${Date.now()}`}
            alt="Profile"
            className="w-full h-full object-cover"
          />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
              No photo
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-800">
            {user.user_name}
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm">Username</label>
          <input
            defaultValue={user.user_name}
            onChange={(e) =>
              setForm({ ...form, user_name: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm">Email</label>
          <input
            value={user.email}
            disabled
            className="w-full border rounded-lg px-3 py-2 bg-gray-100"
          />
        </div>

        <div>
          <label className="text-sm">Bio</label>
          <textarea
            defaultValue={user.bio}
            onChange={(e) =>
              setForm({ ...form, bio: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm">Batch</label>
            <input
              defaultValue={user.batch}
              onChange={(e) =>
                setForm({ ...form, batch: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex-1">
            <label className="text-sm">Department</label>
            <input
              defaultValue={user.department}
              onChange={(e) =>
                setForm({ ...form, department: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="text-sm">Profile photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setForm({
                ...form,
                profile_photo: e.target.files?.[0] ?? null,
              })
            }
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
