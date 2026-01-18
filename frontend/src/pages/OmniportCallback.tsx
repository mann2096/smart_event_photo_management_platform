import {useEffect} from "react";
import {useNavigate,useSearchParams} from "react-router-dom";
import {useAppDispatch} from "../app/hooks";
import { completeAuth } from "../features/auth/authHelpers";

export default function OmniportCallback(){
  const [params]=useSearchParams();
  const navigate=useNavigate();
  const dispatch=useAppDispatch();
  useEffect(() => {
  const access=params.get("access");
  const refresh=params.get("refresh");
  if (!access||!refresh){
    navigate("/login");
    return;
  }
  (async () => {
    await completeAuth(dispatch,access,refresh);
    navigate("/photos");
  })();
},[params,dispatch,navigate]);
  return <p>Logging you in via Omniport...</p>;
}
