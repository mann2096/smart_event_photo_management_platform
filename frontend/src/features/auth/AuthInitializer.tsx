import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { authApi } from "./authApi";
import { setCredentials, logout } from "./authSlice";

export default function AuthInitializer({children,}:{children:React.ReactNode;}){
  const dispatch=useAppDispatch();
  const accessToken=useAppSelector(
    (state) => state.auth.accessToken
  );
  useEffect(() => {
    if (!accessToken || accessToken.length < 20) return;
    dispatch(authApi.endpoints.getMe.initiate()).unwrap()
      .then((user) => {
        dispatch(
          setCredentials({
            user,
            accessToken:accessToken!,
            refreshToken:localStorage.getItem("refreshToken"),
          })
        );
      })
      .catch(() => {
        dispatch(logout());
      });
  },[dispatch,accessToken]);

  return <>{children}</>;
}
