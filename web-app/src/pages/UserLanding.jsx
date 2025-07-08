import { useAuth } from "../context/AuthContext";

function UserLanding() {
  const { user } = useAuth();
  if (!user) return null;

  const display = user.username || user.email || "User";
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <h1 className="text-3xl md:text-4xl font-bold text-blue-400 mb-4">Welcome {display}</h1>
      <p className="text-gray-300">You are now logged in. Use the navigation bar to access all features.</p>
    </div>
  );
}

export default UserLanding;