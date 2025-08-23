import { useState } from "react";
import api from "../utils/api";

export default function UserProfileSection({ user, setUser }) {
  const [edit, setEdit] = useState(false);
  const [username, setUsername] = useState(user.username || "");
  const [email, setEmail] = useState(user.email || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSave() {
    setError(""); setSuccess("");
    try {
      let res = ""
      if(username && !email){
        res = await api.patch(`/users/${user._id}`, { username });
      }
      else if( email && !username ){
         res = await api.patch(`/users/${user._id}`, { email });
      }
      else {
         res = await api.patch(`/users/${user._id}`, { username, email });
      }
      setUser(res.data.user);
      setEdit(false);
      setSuccess("Profile updated!");
    } catch (e) {
      setError(e.response?.data?.error || "Update failed");
    }
  }

  return (
    <section className="bg-gray-800 p-4 rounded">
      <h2 className="font-bold text-lg mb-2 text-blue-200">Profile</h2>
      {!edit ? (
        <div>
          <div className="mb-1 text-gray-300">Username: <b>{user.username || <span className="text-gray-400">Not set</span>}</b></div>
          <div className="mb-1 text-gray-300">Email: <b>{user.email || <span className="text-gray-400">Not set</span>}</b></div>
          <button className="text-blue-400 mt-2" onClick={() => setEdit(true)}>
            {user.username || user.email ? "Edit" : "Add"} Info
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            className="bg-gray-900 text-white rounded p-1"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            className="bg-gray-900 text-white rounded p-1 ml-2"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <div className="space-x-2">
            <button className="bg-blue-500 text-white px-2 rounded" onClick={handleSave}>Save</button>
            <button className="bg-gray-500 text-white px-2 rounded" onClick={() => setEdit(false)}>Cancel</button>
          </div>
          {error && <div className="text-red-400">{error}</div>}
          {success && <div className="text-green-400">{success}</div>}
        </div>
      )}
    </section>
  );
}