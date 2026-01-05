import type { AppDispatch } from "../../app/store";
import { authApi } from "./authApi";
import { setCredentials } from "./authSlice";

export async function completeAuth(
  dispatch:AppDispatch,
  access:string,
  refresh:string|null
){
  localStorage.setItem("accessToken",access);
  if (refresh){
    localStorage.setItem("refreshToken",refresh);
  }
  try{
    const user=await dispatch(
        authApi.endpoints.getMe.initiate()
    ).unwrap();
    dispatch(
        setCredentials({
        user,
        accessToken:access,
        refreshToken:refresh,
        })
    );
    } catch{}
}
