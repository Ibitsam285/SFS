import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { XMarkIcon } from "@heroicons/react/24/outline";

function ManageAccess({ file, onClose, onAccessUpdated }) {
  if (!file) return null;

  const [status, setStatus] = useState("");

  // Search & selection state (users)
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [sharedUserInfos, setSharedUserInfos] = useState([]);

  // Search & selection state (groups)
  const [shareMode, setShareMode] = useState("user");
  const [groupSearch, setGroupSearch] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [sharedGroupInfos, setSharedGroupInfos] = useState([]);

  // Helper: fetch user info by unique IDs
  const fetchUsersByIds = useCallback(async (ids = []) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) return [];
    const results = await Promise.allSettled(
      uniqueIds.map(id => api.get(`/users/${id}`))
    );
    return results
      .filter(r => r.status === "fulfilled")
      .map(r => r.value.data);
  }, []);

  // Helper: fetch group info by unique IDs
  const fetchGroupsByIds = useCallback(async (ids = []) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) return [];
    const results = await Promise.allSettled(
      uniqueIds.map(id => api.get(`/groups/${id}`))
    );
    return results
      .filter(r => r.status === "fulfilled")
      .map(r => r.value.data);
  }, []);

  // Initial load of already shared users/groups
  useEffect(() => {
    (async () => {
      try {
        const [userInfos, groupInfos] = await Promise.all([
          fetchUsersByIds(file.recipients || []),
          fetchGroupsByIds(file.recipientGroups || [])
        ]);
        setSharedUserInfos(userInfos);
        setSharedGroupInfos(groupInfos);
      } catch {
        // ignore
      }
    })();
  }, [file.recipients, file.recipientGroups, fetchUsersByIds, fetchGroupsByIds]);

  // USER search
  const handleUserSearch = async (e) => {
    e.preventDefault();
    if (userSearch.trim().length < 2) {
      setUsers([]);
      setStatus("Please enter at least 2 characters to search.");
      return;
    }
    setStatus("Searching users...");
    try {
      const res = await api.get(`/users/search/${encodeURIComponent(userSearch.trim())}`);
      // Filter out owner & already shared recipients
      const already = new Set((file.recipients || []).map(String));
      const filtered = res.data.filter(u => u._id !== file.ownerId && !already.has(u._id));
      setUsers(filtered);
      setStatus("");
    } catch {
      setUsers([]);
      setStatus("User search failed.");
    }
  };

  // GROUP search
  const handleGroupSearch = async (e) => {
    e.preventDefault();
    if (groupSearch.trim().length < 2) {
      setGroups([]);
      setStatus("Please enter at least 2 characters to search group.");
      return;
    }
    setStatus("Searching groups...");
    try {
      const res = await api.get(`/groups?search=${encodeURIComponent(groupSearch.trim())}`);
      const already = new Set((file.recipientGroups || []).map(String));
      const filtered = res.data.filter(g => !already.has(g._id));
      setGroups(filtered);
      setStatus("");
    } catch {
      setGroups([]);
      setStatus("Group search failed.");
    }
  };

  // SHARE to users
  const handleShareUsers = async () => {
    if (selectedUserIds.length === 0) return;
    setStatus("Sharing file with selected users...");
    try {
      const response = await api.post(`/files/${file._id}/share`, { userIds: selectedUserIds });
      const updatedFile = response.data || file;
      // If endpoint does not return file, uncomment:
      // const updatedFile = (await api.get(`/files/${file._id}`)).data;

      const userInfos = await fetchUsersByIds(updatedFile.recipients || []);
      setSharedUserInfos(userInfos);
      setSelectedUserIds([]);
      setUserSearch("");
      setUsers([]);
      setStatus("File shared with users!");
      onAccessUpdated && onAccessUpdated(updatedFile);
    } catch (err) {
      setStatus(err.response?.data?.error || "Failed to share with users.");
    }
  };

  // SHARE to groups
  const handleShareGroups = async () => {
    if (selectedGroupIds.length === 0) return;
    setStatus("Sharing file with selected groups...");
    try {
      const response = await api.post(`/files/${file._id}/share`, { groupIds: selectedGroupIds });
      const updatedFile = response.data || file;
      // const updatedFile = (await api.get(`/files/${file._id}`)).data;

      const groupInfos = await fetchGroupsByIds(updatedFile.recipientGroups || []);
      setSharedGroupInfos(groupInfos);
      setSelectedGroupIds([]);
      setGroupSearch("");
      setGroups([]);
      setStatus("File shared with groups!");
      onAccessUpdated && onAccessUpdated(updatedFile);
    } catch (err) {
      setStatus(err.response?.data?.error || "Failed to share with groups.");
    }
  };

  const handleRevokeUser = async (userId) => {
    if (!window.confirm("Revoke this user's access?")) return;
    setStatus("Revoking user access...");
    try {
      const response = await api.post(`/files/${file._id}/revoke`, { userIds: [userId] });
      const updatedFile = response.data || file;
      setSharedUserInfos(list => list.filter(u => u._id !== userId));
      setStatus("User access revoked.");
      onAccessUpdated && onAccessUpdated(updatedFile);
    } catch (err) {
      if(err.response?.data.error === "Forbidden"){
        setStatus("You cannot revoke access unless you are the file owner.");
        return;
      }
      setStatus(err.response?.data?.error || "Failed to revoke user.");
    }
  };

  const handleRevokeGroup = async (groupId) => {
    if (!window.confirm("Revoke this group's access?")) return;
    setStatus("Revoking group access...");
    try {
      const response = await api.post(`/files/${file._id}/revoke`, { groupIds: [groupId] });
      const updatedFile = response.data || file;
      setSharedGroupInfos(list => list.filter(g => g._id !== groupId));
      setStatus("Group access revoked.");
      onAccessUpdated && onAccessUpdated(updatedFile);
    } catch (err) {
      setStatus(err.response?.data?.error || "Failed to revoke group.");
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm("This will remove access for ALL users and groups. Continue?")) return;
    setStatus("Revoking all access...");
    try {
      const response = await api.post(`/files/${file._id}/revoke`, { all: true });
      const updatedFile = response.data || file;
      setSharedUserInfos([]);
      setSharedGroupInfos([]);
      setStatus("All access revoked.");
      onAccessUpdated && onAccessUpdated(updatedFile);
    } catch (err) {
      setStatus(err.response?.data?.error || "Failed to revoke all access.");
    }
  };

  // UI
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-lg p-6 relative overflow-y-auto max-h-[90vh] custom-scrollbar">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-red-400"
          onClick={onClose}
        >
          <XMarkIcon className="w-7 h-7" />
        </button>

        <h3 className="text-xl font-bold text-blue-400 mb-4">
          Manage Access: {file.filename}
        </h3>

        {status && <div className="text-sm text-green-300 mb-3">{status}</div>}

        {/* Share mode switch */}
        <div className="flex gap-2 mb-4">
            <button
              type="button"
              className={`px-3 py-1 rounded ${shareMode === "user" ? "bg-blue-700 text-white" : "bg-gray-700 text-gray-200"}`}
              onClick={() => setShareMode("user")}
            >
              Share to Users
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded ${shareMode === "group" ? "bg-blue-700 text-white" : "bg-gray-700 text-gray-200"}`}
              onClick={() => setShareMode("group")}
            >
              Share to Groups
            </button>
        </div>

        {/* USERS SHARE */}
        {shareMode === "user" && (
          <form className="mb-6" onSubmit={handleUserSearch}>
            <label className="text-gray-300 block mb-1">Search user to share:</label>
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
              <div className="bg-gray-800 rounded p-2 mb-2 max-h-40 overflow-y-auto custom-scrollbar">
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
              onClick={handleShareUsers}
              className={`w-full mt-1 font-semibold py-2 rounded transition ${
                selectedUserIds.length === 0
                  ? "bg-green-800 text-green-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              Share to Selected Users
            </button>
          </form>
        )}

        {/* GROUPS SHARE */}
        {shareMode === "group" && (
          <form className="mb-6" onSubmit={handleGroupSearch}>
            <label className="text-gray-300 block mb-1">Search group to share:</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={groupSearch}
                onChange={e => setGroupSearch(e.target.value)}
                className="flex-1 p-2 rounded bg-gray-800 text-gray-100 border border-gray-700 outline-none"
                placeholder="Type group name"
              />
              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white rounded px-3 py-1"
              >
                Search
              </button>
            </div>
            {groups.length > 0 && (
              <div className="bg-gray-800 rounded p-2 mb-2 max-h-40 overflow-y-auto custom-scrollbar">
                {groups.map(g => (
                  <label key={g._id} className="block text-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(g._id)}
                      onChange={e => {
                        if (e.target.checked)
                          setSelectedGroupIds(ids => [...ids, g._id]);
                        else
                          setSelectedGroupIds(ids => ids.filter(id => id !== g._id));
                      }}
                      className="mr-2"
                    />
                    {g.name}
                  </label>
                ))}
              </div>
            )}
            <button
              type="button"
              disabled={selectedGroupIds.length === 0}
              onClick={handleShareGroups}
              className={`w-full mt-1 font-semibold py-2 rounded transition ${
                selectedGroupIds.length === 0
                  ? "bg-green-800 text-green-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              Share to Selected Groups
            </button>
          </form>
        )}

        {/* REVOKE ALL */}
        <div className="mb-4">
          <button
            onClick={handleRevokeAll}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-2 rounded transition"
          >
            Revoke All Access
          </button>
        </div>

        {/* Shared users/groups (scrollable) */}
        <div>
          <div className="text-gray-300 mb-2 font-semibold">Current Access:</div>
          {(sharedUserInfos.length === 0 && sharedGroupInfos.length === 0) && (
            <div className="text-gray-400 mb-4">No users or groups have access.</div>
          )}
          <div className="max-h-60 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {sharedUserInfos.length > 0 && (
              <div>
                <div className="text-gray-400 mb-1 font-semibold">Users ({sharedUserInfos.length}):</div>
                <ul className="space-y-1">
                  {sharedUserInfos.map(u => (
                    <li key={u._id} className="flex justify-between items-center bg-gray-800 rounded p-2">
                      <span className="text-gray-200 truncate">{u.username || u.email || u._id}</span>
                      <button
                        onClick={() => handleRevokeUser(u._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Revoke
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {sharedGroupInfos.length > 0 && (
              <div>
                <div className="text-gray-400 mb-1 font-semibold">Groups ({sharedGroupInfos.length}):</div>
                <ul className="space-y-1">
                  {sharedGroupInfos.map(g => (
                    <li key={g._id} className="flex justify-between items-center bg-gray-800 rounded p-2">
                      <span className="text-gray-200 truncate">{g.name}</span>
                      <button
                        onClick={() => handleRevokeGroup(g._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Revoke
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ManageAccess;