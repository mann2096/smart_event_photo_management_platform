import {useEffect} from "react";
import {useNavigate,useSearchParams} from "react-router-dom";
import {useAppDispatch} from "../app/hooks";
import {setTokens} from "../features/auth/authSlice";

export default function OmniportCallback(){
  const [params]=useSearchParams();
  const navigate=useNavigate();
  const dispatch=useAppDispatch();
  useEffect(() => {
    const access=params.get("access");
    const refresh=params.get("refresh")
    if (!access||!refresh) {
      navigate("/login");
      return;
    }
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
    dispatch(
      setTokens({
        accessToken:access,
        refreshToken:refresh,
      })
    );
    navigate("/dashboard");
  },[params,dispatch,navigate]);
  return <p>Logging you in via Omniport...</p>;
}
