import { useEffect, useState } from "react";
import api from "../utils/api";
import UserProfileSection from "../components/UserProfileSection";
import PasswordChangeSection from "../components/PasswordChangeSection";

export default function AdminSettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const res = await api.get("/users/me");
        setUser(res.data.user || res.data); 
      } catch (e) {
        setError("Failed to load your profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  if (loading) return <div className="p-8 text-gray-200">Loading...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto mt-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-200 mb-4">Admin Settings</h1>
      <UserProfileSection user={user} setUser={setUser} />
      <PasswordChangeSection user={user} />
    </div>
  );
}