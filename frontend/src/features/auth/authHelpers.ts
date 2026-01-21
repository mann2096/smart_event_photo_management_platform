import type { AppDispatch } from "../../app/store";
import { authApi } from "./authApi";
import { logout, setCredentials } from "./authSlice";

export async function completeAuth(
  dispatch: AppDispatch,
  access: string,
  refresh: string | null
) {
  try {
    dispatch(
      setCredentials({
        user: null,
        accessToken: access,
        refreshToken: refresh,
      })
    );
    const user = await dispatch(
      authApi.endpoints.getMe.initiate()
    ).unwrap();
    dispatch(
      setCredentials({
        user,
        accessToken: access,
        refreshToken: refresh,
      })
    );
  } catch (err) {
    console.error("getMe failed:", err);
    dispatch(logout());
  }
}
