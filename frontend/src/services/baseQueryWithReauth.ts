import type {BaseQueryFn,FetchArgs,FetchBaseQueryError,} from "@reduxjs/toolkit/query/react";
import {fetchBaseQuery,} from "@reduxjs/toolkit/query/react";
import { logout,setTokens } from "../features/auth/authSlice";

const baseQuery=fetchBaseQuery({
  baseUrl:"https://boltless-carolann-subfoliate.ngrok-free.dev/api",
  prepareHeaders: (headers) => {
    headers.set("ngrok-skip-browser-warning", "true");
    const token=localStorage.getItem("accessToken");
    if(token){
      headers.set("Authorization",`Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  const existingRefreshToken = localStorage.getItem("refreshToken");

  const requestUrl =
    typeof args === "string" ? args : args.url;

  const isAuthEndpoint =
    requestUrl.includes("/auth/login") ||
    requestUrl.includes("/auth/refresh") ||
    requestUrl.includes("/users/register") ||
    requestUrl.includes("/users/verify-otp");

  if (result.error?.status === 401 && !isAuthEndpoint) {
    if (!existingRefreshToken) {
      api.dispatch(logout());
      return result;
    }

    const refreshResult = await baseQuery(
      {
        url: "/auth/refresh/",
        method: "POST",
        body: { refresh: existingRefreshToken },
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const { access } = refreshResult.data as {
        access: string;
      };

      localStorage.setItem("accessToken", access);

      api.dispatch(
        setTokens({
          accessToken: access,
          refreshToken: existingRefreshToken,
        })
      );
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

