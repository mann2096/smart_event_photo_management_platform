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

  const [otp, setOtp]=useState("");
  const [verifyOTP,{isLoading,error}]=useVerifyOTPMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email){
      navigate("/register");
      return;
    }
    try {
      const tokens = await verifyOTP({email,otp}).unwrap();
      await completeAuth(dispatch, tokens.access, tokens.refresh);
      navigate("/photos");
    } catch {
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-semibold text-gray-900 text-center">
          Verify your email
        </h2>
        <p className="text-sm text-gray-500 text-center mt-1">
          Enter the 6-digit code sent to
        </p>
        <p className="text-sm font-medium text-gray-700 text-center mt-1 break-all">
          {email}
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
              Verification code
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center tracking-widest rounded-lg border border-gray-300
                         px-4 py-3 text-lg font-medium
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">
              Invalid or expired OTP
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 text-white py-2.5 text-sm font-medium
                       hover:bg-blue-700 transition disabled:opacity-60"
          >
            {isLoading ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>
        <p className="text-sm text-gray-500 text-center mt-6">
          Didn’t receive the code?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-blue-600 hover:underline font-medium cursor-pointer"
          >
            Try again
          </span>
        </p>
      </div>
    </div>
  );
}
