import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setError("");
    try {
      await signup(data);
      navigate("/");
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
          <label className="block text-gray-300 mb-1">Username</label>
          <input
            {...register("username", { required: true })}
            className="w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:border-blue-400 outline-none"
            autoFocus
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Email</label>
          <input
            {...register("email", { required: true })}
            type="email"
            className="w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:border-blue-400 outline-none"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-300 mb-1">Password</label>
          <input
            {...register("password", { required: true, minLength: 6 })}
            type="password"
            className="w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:border-blue-400 outline-none"
          />
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