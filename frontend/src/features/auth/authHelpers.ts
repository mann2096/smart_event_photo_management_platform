import type { AppDispatch } from "../../app/store";
import { authApi } from "./authApi";
import { logout, setCredentials } from "./authSlice";

export async function completeAuth(dispatch:AppDispatch,access:string,refresh:string|null){
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.setItem("accessToken",access);
  if (refresh){
    localStorage.setItem("refreshToken",refresh);
  }
  try{
    const user=await dispatch(authApi.endpoints.getMe.initiate()).unwrap();
    dispatch(
        setCredentials({
        user,
        accessToken:access,
        refreshToken:refresh,
        })
    );
    } catch (err) {
    console.error("getMe failed:", err);
    dispatch(logout()); 
  }
}
