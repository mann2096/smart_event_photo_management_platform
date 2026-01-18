import {Navigate} from "react-router-dom";
import {useAppSelector} from "../app/hooks";
import type { JSX } from "react";

export default function ProtectedRoute({children}:{children:JSX.Element;}){
  const isAuthenticated=useAppSelector((state) => state.auth.isAuthenticated);
  if(!isAuthenticated){
    return <Navigate to="/login" replace />;
  }
  return children;
}
