import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { authApi } from "./authApi";
import { setCredentials, logout } from "./authSlice";

export default function AuthInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();

  const { accessToken, refreshToken, user } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (!accessToken || accessToken.length < 20 || user) return;
    dispatch(authApi.endpoints.getMe.initiate())
      .unwrap()
      .then((user) => {
        dispatch(
          setCredentials({
            user,
            accessToken,
            refreshToken,
          })
        );
      })
      .catch(() => {
        dispatch(logout());
      });
  }, [dispatch, accessToken, refreshToken, user]);

  return <>{children}</>;
}
