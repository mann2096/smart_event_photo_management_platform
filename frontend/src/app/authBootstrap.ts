import { setCredentials, logout } from "../features/auth/authSlice";

export function authBootstrap(dispatch:any) {
  const accessToken=localStorage.getItem("accessToken");
  const refreshToken=localStorage.getItem("refreshToken");

  if (!accessToken || !refreshToken) {
    dispatch(logout());
    return;
  }

  dispatch(
    setCredentials({
      user: null,
      accessToken,
      refreshToken,
    })
  );
}
