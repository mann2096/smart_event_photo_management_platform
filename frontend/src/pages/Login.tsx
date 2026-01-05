import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useLoginMutation} from "../features/auth/authApi";
import {useAppDispatch} from "../app/hooks";
import {Link} from "react-router-dom";
import { completeAuth } from "../features/auth/authHelpers";

const OMNIPORT_LOGIN_URL="https://channeli.in/oauth/authorize/?" +`client_id=${import.meta.env.VITE_OMNIPORT_CLIENT_ID}` +"&redirect_uri=http://127.0.0.1:8000/api/users/auth/omniport/callback/" +"&response_type=code";

export default function Login(){
  const navigate=useNavigate();
  const dispatch=useAppDispatch();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [login,{isLoading,error}]=useLoginMutation();
  const handleSubmit=async (e:React.FormEvent) => {
    e.preventDefault();
    try{
      const tokens=await login({ email, password }).unwrap();
      await completeAuth(
        dispatch,
        tokens.access,
        tokens.refresh
      );
      navigate("/dashboard");
    }catch(err){
      console.error("Login failed",err);
    }
  };
  return(
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </div>
        <div>
          <label>Password:</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        </div>
        <button type="submit" disabled={isLoading}>Login</button>
      </form>
      {error&&<p>Login failed</p>}
      <hr />
      <button onClick={() => (window.location.href=OMNIPORT_LOGIN_URL)}>
        Login with Omniport
      </button>
      <p>
        New here?{" "}
        <Link to="/register">
          Create an account
        </Link>
      </p>
    </div>
  );
}
