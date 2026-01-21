import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLoginMutation, useOmniportLoginMutation } from "../features/auth/authApi";
import { useAppDispatch } from "../app/hooks";
import { completeAuth } from "../features/auth/authHelpers";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    try{
      const tokens=await login({email,password}).unwrap();
      await completeAuth(dispatch, tokens.access, tokens.refresh);
      navigate("/photos");
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const [startOmniportLogin] = useOmniportLoginMutation();
  const handleOmniportLogin = async () => {
    try{
      const res = await startOmniportLogin().unwrap();
      window.location.href = res.authorization_url;
    } catch (err) {
      console.error("Omniport login failed", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-semibold text-gray-900 text-center">
          Sign in
        </h2>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              Invalid email or password
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 text-white py-2.5 text-sm font-medium
                       hover:bg-blue-700 transition disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <button
          onClick={handleOmniportLogin}
          className="w-full rounded-lg border border-gray-300 py-2.5 text-sm font-medium
                     text-gray-700 hover:bg-gray-50 transition"
        >
          Continue with Omniport
        </button>
        <p className="text-sm text-gray-500 text-center mt-6">
          New here?{" "}
          <Link
            to="/register"
            className="text-blue-600 hover:underline font-medium"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
