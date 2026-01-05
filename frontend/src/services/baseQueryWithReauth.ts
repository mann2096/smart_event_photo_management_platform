import type {BaseQueryFn,FetchArgs,FetchBaseQueryError,} from "@reduxjs/toolkit/query/react";
import {fetchBaseQuery,} from "@reduxjs/toolkit/query/react";
import { logout, setTokens } from "../features/auth/authSlice";
import { api as rtkApi } from "./api";

const baseQuery=fetchBaseQuery({
  baseUrl:"http://127.0.0.1:8000/api",
  prepareHeaders: (headers) => {
    const token=localStorage.getItem("accessToken");
    if(token){
      headers.set("Authorization",`Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth:BaseQueryFn<string|FetchArgs,unknown,FetchBaseQueryError>=async(args,api,extraOptions) => {
  let result=await baseQuery(args,api,extraOptions);
  const existingRefreshToken=localStorage.getItem("refreshToken");
  if (result.error?.status===401) {
    const refreshToken=localStorage.getItem("refreshToken");
    if(!refreshToken){
      api.dispatch(logout());
      return result;
    }
    const refreshResult=await baseQuery(
      {
        url:"/auth/refresh/",
        method:"POST",
        body:{refresh:refreshToken},
      },
      api,
      extraOptions
    );
    if(refreshResult.data){
      const {access}=refreshResult.data as {access:string};
      localStorage.setItem("accessToken",access);
      api.dispatch(
        setTokens({
          accessToken:access,
          refreshToken:existingRefreshToken,
        })
      );
      api.dispatch(rtkApi.util.resetApiState());
      result=await baseQuery(args,api,extraOptions);
    }
 else{
      api.dispatch(logout());
    }
  }
  return result;
};
