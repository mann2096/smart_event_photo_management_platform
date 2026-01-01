import {useEffect} from "react";
import {useGetMeQuery} from "../auth/authApi";
import {useAppDispatch} from "../../app/hooks";
import {setCredentials,logout} from "./authSlice";

export default function AuthInitializer({children}:{children:React.ReactNode;}){
  const dispatch=useAppDispatch();
  const{data,isSuccess,isError}=useGetMeQuery(undefined,{
    skip:!localStorage.getItem("accessToken"),
  });
  useEffect(() => {
    if(isSuccess&&data) {
      dispatch(
        setCredentials({
          user:data,
          accessToken:localStorage.getItem("accessToken")!,
          refreshToken:localStorage.getItem("refreshToken"),
        })
      );
    }
    if(isError) {
      dispatch(logout());
    }
  },[isSuccess,isError,data,dispatch]);
  
  return <>{children}</>;
}
