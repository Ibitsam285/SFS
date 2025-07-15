import { useState, useEffect } from "react";
import api from "../utils/api";
import { XMarkIcon } from "@heroicons/react/24/outline";

function toInputDateTimeValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toISOString().slice(0, 16);
}

function ManageAccess({ file, onClose }) {
  if (!file) return null;
  const accessControl = file.accessControl || {};
  const [expiry, setExpiry] = useState(accessControl.expiry ? toInputDateTimeValue(accessControl.expiry) : "");
  const [maxDownloads, setMaxDownloads] = useState(accessControl.maxDownloads ? String(accessControl.maxDownloads) : "");
  const [revoked, setRevoked] = useState(accessControl.revoked || false);
  const [status, setStatus] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [sharedUserInfos, setSharedUserInfos] = useState([]); 

  useEffect(() => {
    async function fetchSharedInfos() {
      if (!file.recipients || file.recipients.length === 0) {
        setSharedUserInfos([]);
        return;
      }
      try {
        const infos = await Promise.all(
          file.recipients.map(uid =>
            api.get(`/users/${uid}`).then(r => r.data)
          )
        );
        setSharedUserInfos(infos);
      } catch {
        setSharedUserInfos([]);
      }
    }
    fetchSharedInfos();
  }, [file.recipients]);

  const handleUserSearch = async (e) => {
    e.preventDefault();
    if (userSearch.length < 2) {
      setUsers([]);
      setStatus("Please enter at least 2 characters to search.");
      return;
    }
    setStatus("Searching...");
    try {
      const res = await api.get(`/users/search/${encodeURIComponent(userSearch)}`);
      setStatus("");
    } catch (err) {
      setUsers([]);
      setStatus("Search failed.");
    }
  };

  const handleUpdateAccess = async (e) => {
    e.preventDefault();
    setStatus("Updating access...");

    let payload = {};
    if (expiry) {
      payload.expiry = new Date(expiry).toISOString();
    } else if (maxDownloads) {
      payload.maxDownloads = parseInt(maxDownloads, 10);
    }
    payload.revoked = revoked;

    if (!expiry && !maxDownloads && !revoked) {
      setStatus("Set at least one access control (expiry, max downloads, or revoke).");
      return;
    }

    try {
      await api.patch(`/files/${file._id}/access`, payload);
      setStatus("Access updated!");
    } catch (err) {
      setStatus(err.response?.data?.error || "Failed to update access.");
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) return;
    setStatus("Sharing file...");
    try {
      await api.post(`/files/${file._id}/share`, { userIds: selectedUserIds });
      const infos = await Promise.all(
        [...file.recipients, ...selectedUserIds].map(uid =>
          api.get(`/users/${uid}`).then(r => r.data)
        )
      );
      setSharedUserInfos(infos);
      setSelectedUserIds([]);
      setUserSearch("");
      setUsers([]);
      setStatus("File shared!");
    } catch (err) {
      setStatus(err.response?.data?.error || "Failed to share file.");
    }
  };

  const handleRevokeUser = async (userId) => {
    if (!window.confirm("Revoke this user's access?")) return;
    setStatus("Revoking access...");
    try {
      await api.post(`/files/${file._id}/revoke`, { userIds: [userId] });
      setSharedUserInfos(s => s.filter(u => u._id !== userId));
      setStatus("Access revoked!");
    } catch (err) {
      setStatus(err.response?.data?.error || "Failed to revoke access.");
    }
  };

  const handleExpiryChange = (val) => {
    setExpiry(val);
    if (val) setMaxDownloads("");
  };
  const handleMaxDownloadsChange = (val) => {
    setMaxDownloads(val);
    if (val) setExpiry("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-red-400"
          onClick={onClose}
        >
          <XMarkIcon className="w-7 h-7" />
        </button>
        <h3 className="text-xl font-bold text-blue-400 mb-4">Manage Access: {file.filename}</h3>
        <form className="mb-4 space-y-3" onSubmit={handleUpdateAccess}>
          <div>
            <label className="text-gray-300">Expiry (only one allowed)</label>
            <input
              type="datetime-local"
              value={expiry}
              onChange={e => handleExpiryChange(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700 outline-none"
              disabled={!!maxDownloads}
            />
          </div>
          <div>
            <label className="text-gray-300">Max Downloads (only one allowed)</label>
            <input
              type="number"
              min="1"
              value={maxDownloads}
              onChange={e => handleMaxDownloadsChange(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700 outline-none"
              disabled={!!expiry}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-300">Revoke All Access</label>
            <input
              type="checkbox"
              checked={revoked}
              onChange={e => setRevoked(e.target.checked)}
              className="w-5 h-5"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded transition w-full"
          >
            Update Access Control
          </button>
        </form>

        <form className="mb-4" onSubmit={handleUserSearch}>
          <label className="text-gray-300">Search user to share:</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="flex-1 p-2 rounded bg-gray-800 text-gray-100 border border-gray-700 outline-none"
              placeholder="Type username or email"
            />
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white rounded px-3 py-1"
            >
              Search
            </button>
          </div>
          {users.length > 0 && (
            <div className="bg-gray-800 rounded p-2 mb-2 max-h-32 overflow-auto">
              {users.map(u => (
                <label key={u._id} className="block text-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(u._id)}
                    onChange={e => {
                      if (e.target.checked)
                        setSelectedUserIds(ids => [...ids, u._id]);
                      else
                        setSelectedUserIds(ids => ids.filter(id => id !== u._id));
                    }}
                    className="mr-2"
                  />
                  {u.username || u.email}
                </label>
              ))}
            </div>
          )}
          <button
            type="button"
            disabled={selectedUserIds.length === 0}
            onClick={handleShare}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-4 rounded transition"
          >
            Share
          </button>
        </form>

        <div className="mb-2">
          <div className="text-gray-300 mb-1">Who has access:</div>
          {sharedUserInfos.length === 0 ? (
            <div className="text-gray-400">No users have access.</div>
          ) : (
            <ul className="space-y-1">
              {sharedUserInfos.map(u => (
                <li key={u._id} className="flex justify-between items-center bg-gray-800 rounded p-2">
                  <span className="text-gray-200">{u.username || u.email || u._id}</span>
                  <button
                    onClick={() => handleRevokeUser(u._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {status && <div className="text-gray-300 mt-2">{status}</div>}
      </div>
    </div>
  );
}

export default ManageAccess;