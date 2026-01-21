import type { AppDispatch } from "../app/store";
import { logout } from "../features/auth/authSlice";

export function authBootstrap(dispatch: AppDispatch) {

  dispatch((_, getState) => {
    const {accessToken,refreshToken} = getState().auth;
    if (!accessToken || !refreshToken) {
      dispatch(logout());
    }
  });
}
