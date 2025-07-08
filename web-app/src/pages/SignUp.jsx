import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

function isEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function SignUp() {
  const { signup, signin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm();
  const identifier = watch("identifier");

  const onSubmit = async (data) => {
    setError("");
    let payload = { password: data.password };
    if (data.identifier) {
      if (isEmail(data.identifier)) {
        payload.email = data.identifier;
      } else {
        payload.username = data.identifier;
      }
    }
    try {
      const res = await signup(payload);
      // Optionally, automatically sign in after signup:
      if (res && res.message === "Sign up successful!") {
        // Try to sign in
        await signin(payload);
        // Fetch user role (from context)
        // Redirect based on role (default user to /user)
        navigate("/user");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Sign up failed. Please check your information."
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-2">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm bg-gray-900 p-8 rounded-lg shadow"
      >
        <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">Sign Up</h2>
        {error && <div className="bg-red-800 text-red-200 rounded px-3 py-2 mb-4">{error}</div>}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Username or Email</label>
          <input
            {...register("identifier", { required: true })}
            className="w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:border-blue-400 outline-none"
            autoFocus
            placeholder="Enter username or email"
          />
        </div>
        <div className="mb-6 relative">
          <label className="block text-gray-300 mb-1">Password</label>
          <input
            {...register("password", { required: true, minLength: 6 })}
            type={showPassword ? "text" : "password"}
            className="w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:border-blue-400 outline-none pr-10"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-8 text-gray-400 hover:text-blue-400"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded transition disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing up..." : "Sign Up"}
        </button>
        <div className="text-gray-400 mt-6 text-center">
          Already have an account?{" "}
          <Link to="/signin" className="text-blue-400 hover:underline">Sign in</Link>
        </div>
      </form>
    </div>
  );
}

export default SignUp;