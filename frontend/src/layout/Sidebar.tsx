import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { logoutAndReset } from "../features/auth/authSlice";

type SidebarProps = {
  onClose?: () => void;
};

export default function Sidebar({ onClose }:SidebarProps) {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const linkBase =
    "flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition";
  const active = "bg-blue-50 text-blue-600";
  const inactive = "text-gray-700 hover:bg-gray-100";

  const isActive = (path:string):string =>
    location.pathname.startsWith(path) ? active : inactive;

  const handleLogout = () => {
    dispatch(logoutAndReset());
    navigate("/login");
    onClose?.();
  };

  const handleNav = () => onClose?.();

  return (
    <aside className="h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">SensePic</h2>
        <button
          className="md:hidden text-sm text-gray-500"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <Link to="/photos" onClick={handleNav} className={`${linkBase} ${isActive("/photos")}`}>
          Photos
        </Link>

        <Link to="/public" onClick={handleNav} className={`${linkBase} ${isActive("/public")}`}>
          Public
        </Link>

        <Link to="/notifications" onClick={handleNav} className={`${linkBase} ${isActive("/notifications")}`}>
          Notifications
        </Link>

        <Link to="/favourites" onClick={handleNav} className={`${linkBase} ${isActive("/favourites")}`}>
          Favourites
        </Link>

        <Link to="/tagged" onClick={handleNav} className={`${linkBase} ${isActive("/tagged")}`}>
          Tagged in
        </Link>

        <Link to="/events" onClick={handleNav} className={`${linkBase} ${isActive("/events")}`}>
          Events
        </Link>

        {user && (
          <Link
            to="/dashboard"
            onClick={handleNav}
            className={`${linkBase} ${isActive("/dashboard")}`}
          >
            Photographer Dashboard
          </Link>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2.5 rounded-lg
                     text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
