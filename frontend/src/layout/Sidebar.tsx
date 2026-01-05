import { Link } from "react-router-dom";
import { useAppSelector } from "../app/hooks";

export default function Sidebar(){
  const user=useAppSelector((state) => state.auth.user);
  return (
    <aside>
      <h2>SensePic</h2>
      <ul>
        <li>
          <Link to="/photos">Photos</Link>
        </li>
        <li>
          <Link to="/public">Public</Link>
        </li>
        <li>
          <Link to="/notifications">Notifications</Link>
        </li>
        <li>
          <Link to="/favourites">Favourites</Link>
        </li>
        <li>
          <Link to="/tagged">Tagged In</Link>
        </li>
        <li>
          <Link to="/events">Events</Link>
        </li>
        {user && (
          <li>
            <Link to="/dashboard">Photographer Dashboard</Link>
          </li>
        )}
      </ul>
    </aside>
  );
}
