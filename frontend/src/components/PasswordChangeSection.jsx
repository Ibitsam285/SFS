import { useState } from "react";
import api from "../utils/api";

export default function PasswordChangeSection({ user }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleChange() {
    setSuccess(""); setError("");
    try {
      await api.patch(`/users/${user._id}`, { oldPassword, newPassword });
      setSuccess("Password changed!");
      setOldPassword(""); setNewPassword("");
    } catch (e) {
      setError(e.response?.data?.error || "Change failed");
    }
  }

  return (
    <section className="bg-gray-800 p-4 rounded">
      <h2 className="font-bold text-lg mb-2 text-blue-200">Change Password</h2>
      <input
        type="password"
        className="bg-gray-900 text-white rounded p-1 pl-3 ml-1"
        placeholder="Old password"
        value={oldPassword}
        onChange={e => setOldPassword(e.target.value)}
      />
      <input
        type="password"
        className="bg-gray-900 text-white rounded p-1 pl-3 ml-1"
        placeholder="New password"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
      />
      <button className="bg-blue-500 text-white px-2 rounded ml-2" onClick={handleChange}>
        Update
      </button>
      {error && <div className="text-red-400">{error}</div>}
      {success && <div className="text-green-400">{success}</div>}
    </section>
  );
}