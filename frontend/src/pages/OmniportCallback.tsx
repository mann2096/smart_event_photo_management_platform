import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../app/hooks";
import { completeAuth } from "../features/auth/authHelpers";

export default function OmniportCallback() {
  const [params] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    const access = params.get("access");
    const refresh = params.get("refresh");
    if (!access) {
      navigate("/login", { replace: true });
      return;
    }
    (async () => {
      try {
        await completeAuth(dispatch, access, refresh);
        navigate("/photos", { replace: true });
      } catch {
        navigate("/login", { replace: true });
      }
    })();
  }, []);


  return <div>Signing you in…</div>;
}
