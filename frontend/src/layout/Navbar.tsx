import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { setFilters, clearFilters } from "../features/photos/photoFiltersSlice";

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const filters = useAppSelector(
    (state) => state.photoFilters
  );

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="flex items-center gap-6 px-6 py-3 overflow-x-auto">
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-medium text-gray-700">
            Date
          </span>

          <input
            type="date"
            value={filters.startDate ?? ""}
            onChange={(e) =>
              dispatch(
                setFilters({
                  startDate: e.target.value || undefined,
                })
              )
            }
            className="rounded-lg border px-3 py-1.5 text-sm"
          />

          <span className="text-gray-400">–</span>

          <input
            type="date"
            value={filters.endDate ?? ""}
            onChange={(e) =>
              dispatch(
                setFilters({
                  endDate: e.target.value || undefined,
                })
              )
            }
            className="rounded-lg border px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium text-gray-700">
            Tags
          </span>

          <input
            type="text"
            placeholder="sunset,beach"
            value={filters.tags.join(",")}
            onChange={(e) =>
              dispatch(
                setFilters({
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              )
            }
            className="w-44 rounded-lg border px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium text-gray-700">
            Event
          </span>

          <input
            type="text"
            placeholder="Search events"
            value={filters.eventName}
            onChange={(e) =>
              dispatch(
                setFilters({
                  eventName: e.target.value,
                })
              )
            }
            className="w-44 rounded-lg border px-3 py-1.5 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm shrink-0">
          <input
            type="checkbox"
            checked={filters.timeline}
            onChange={(e) =>
              dispatch(
                setFilters({
                  timeline: e.target.checked,
                })
              )
            }
          />
          Timeline
        </label>

        <div className="flex-1" />
        <button
          onClick={() => dispatch(clearFilters())}
          className="px-3 py-1.5 text-sm rounded-lg
                     bg-gray-100 hover:bg-gray-200"
        >
          Clear filters
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="px-4 py-1.5 text-sm border rounded-lg"
        >
          Profile
        </button>
      </div>
    </header>
  );
}
