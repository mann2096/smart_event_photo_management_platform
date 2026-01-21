import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout, setTokens } from "../features/auth/authSlice";
import type { RootState } from "../app/store";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "https://boltless-carolann-subfoliate.ngrok-free.dev/api",
  prepareHeaders: (headers, { getState }) => {
    headers.set("ngrok-skip-browser-warning", "true");

    const state = getState() as RootState;
    const token = state.auth.accessToken;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const baseQueryWithReauth:BaseQueryFn<string | FetchArgs,unknown,FetchBaseQueryError> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  const state = api.getState() as RootState;
  const refreshToken=state.auth.refreshToken;
  const requestUrl = typeof args === "string" ? args : args.url;

  const isAuthEndpoint =
    requestUrl.includes("/auth/login") ||
    requestUrl.includes("/auth/refresh") ||
    requestUrl.includes("/users/register") ||
    requestUrl.includes("/users/verify-otp");

  if (result.error?.status === 401 && !isAuthEndpoint) {
    if (!refreshToken) {
      api.dispatch(logout());
      return result;
    }

    const refreshResult = await rawBaseQuery(
      {
        url: "/auth/refresh/",
        method: "POST",
        body: { refresh: refreshToken },
      },
      api,
      extraOptions
    );

    if (refreshResult.data){
      const {access}=refreshResult.data as { access: string };
      api.dispatch(
        setTokens({
          accessToken: access,
          refreshToken,
        })
      );
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};
