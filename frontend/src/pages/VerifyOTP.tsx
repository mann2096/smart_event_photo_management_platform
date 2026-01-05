import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useVerifyOTPMutation } from "../features/auth/authApi";
import { useAppDispatch } from "../app/hooks";
import { completeAuth } from "../features/auth/authHelpers";

export default function VerifyOTP() {
  const navigate=useNavigate();
  const dispatch=useAppDispatch();
  const [params]=useSearchParams();
  const email=params.get("email");
  const [otp,setOtp]=useState("");
  const [verifyOTP,{isLoading,error}]=useVerifyOTPMutation();
  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    if(!email){
      navigate("/register");
      return;
    }
    try{
      const tokens=await verifyOTP({email,otp}).unwrap();
      await completeAuth(dispatch,tokens.access,tokens.refresh);
      navigate("/dashboard");
    }catch{}
  };
  return(
    <div>
      <h2>Verify OTP</h2>
      <p>Email: {email}</p>
      <form onSubmit={handleSubmit}>
        <input value={otp} onChange={(e) => setOtp(e.target.value)}/>
        <button disabled={isLoading}>Verify</button>
      </form>
      {error && <p>Invalid or expired OTP</p>}
    </div>
  );
}
