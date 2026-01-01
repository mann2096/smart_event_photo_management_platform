import {useAppDispatch,useAppSelector} from "../app/hooks";
import {logout} from "../features/auth/authSlice";

export default function Dashboard() {
  const dispatch=useAppDispatch();
  const user=useAppSelector((state) => state.auth.user);
  const handleLogout = () => {
    dispatch(logout());
  }; 

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome {user?.user_name}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
