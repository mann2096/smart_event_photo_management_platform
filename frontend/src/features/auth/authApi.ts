import { api } from "../../services/api";
import type { User,AuthTokens } from "./types";

interface LoginRequest{
  email:string;
  password:string;
}
interface RegisterRequest{
  email:string;
  password:string;
}
interface VerifyOTPRequest{
  email:string;
  otp:string;
}
export const authApi=api.injectEndpoints({
  endpoints:(builder) => ({
    login:builder.mutation<AuthTokens,LoginRequest>({
      query:(data) => ({
        url:"/auth/login/",
        method:"POST",
        body:data,
      }),
    }),
    register:builder.mutation<{detail:string},RegisterRequest>({
      query:(data) => ({
        url:"/users/register/",
        method:"POST",
        body:data,
      }),
    }),
    verifyOTP:builder.mutation<AuthTokens,VerifyOTPRequest>({
      query:(data) => ({
        url:"/users/verify-otp/",
        method:"POST",
        body:data,
      }),
    }),
    getMe:builder.query<User,void>({
      query: () => "/users/me/",
    }),
  }),
});

export const{
  useLoginMutation,
  useRegisterMutation,
  useVerifyOTPMutation,
  useGetMeQuery,
}=authApi;
