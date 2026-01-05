import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useRegisterMutation} from "../features/auth/authApi";

export default function Register(){
  const navigate=useNavigate();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [register,{isLoading,error}]=useRegisterMutation();
  const handleSubmit=async(e:React.FormEvent) => {
    e.preventDefault();
    try{
      await register({email,password}).unwrap();
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    }catch(err){
      console.error("Registration failed",err);
    }
  };
  return(
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}/>
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          Register
        </button>
      </form>
      {error&&<p>Registration failed</p>}
    </div>
  );
}
