import { useEffect, useState } from "react";
import axios from "axios";

function ConfirmModal({ show, onClose, onConfirm, title, message }) {
  if (!show) return null;
  return (
    <div className="fixed z-50 inset-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm border border-gray-700">
        <div className="text-lg font-semibold text-gray-200 mb-2">{title}</div>
        <div className="text-gray-300 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">Confirm</button>
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024/1024).toFixed(2)} MB`;
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AdminManageFiles() {
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [groupsMap, setGroupsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [filesRes, usersRes, groupsRes] = await Promise.all([
          axios.get("/api/files/all"),
          axios.get("/api/users/"),
          axios.get("/api/groups/all"),
        ]);
        setFiles(filesRes.data);
        setUsers(usersRes.data);
        setGroups(groupsRes.data);
        setUsersMap(Object.fromEntries(usersRes.data.map(u => [String(u._id), u])));
        setGroupsMap(Object.fromEntries(groupsRes.data.map(g => [String(g._id), g])));
      } catch (err) {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`/api/files/${fileId}`);
      setFiles(files => files.filter(f => f._id !== fileId));
    } catch {
      setError("Could not delete file.");
    }
  };

  if (loading) return <div className="text-center p-8 text-gray-300">Loading...</div>;
  if (error) return <div className="text-center text-red-400">{error}</div>;

  return (
    <div className="p-6 overflow-x-auto custom-scrollbar">
      <h1 className="text-2xl font-bold mb-4 text-gray-200">Manage Files</h1>
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="min-w-full bg-gray-800 rounded-lg shadow table-fixed">
          <thead>
            <tr className="bg-gray-700 text-gray-200">
              <th className="p-2 text-left whitespace-nowrap w-1/6">Filename</th>
              <th className="p-2 text-left whitespace-nowrap w-1/7">Owner</th>
              <th className="p-2 text-left whitespace-nowrap w-1/6">Recipients</th>
              <th className="p-2 text-left whitespace-nowrap w-1/6">Groups</th>
              <th className="p-2 text-left whitespace-nowrap w-1/12">Size</th>
              <th className="p-2 text-left whitespace-nowrap w-1/12">Type</th>
              <th className="p-2 text-left whitespace-nowrap w-1/8">Uploaded</th>
              <th className="p-2 text-left whitespace-nowrap w-1/12">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map(f => (
              <tr key={f._id} className="border-b border-gray-700 text-gray-200 align-top">
                <td className="p-2 align-top whitespace-nowrap">{f.filename}</td>
                <td className="p-2 align-top whitespace-nowrap">
                  {(usersMap[f.ownerId] && (usersMap[f.ownerId].username || usersMap[f.ownerId].email)) || <span className="text-gray-400">Unknown</span>}
                </td>
                <td className="p-2 align-top">
                  {f.recipients.length === 0
                    ? <span className="text-gray-400">None</span>
                    : f.recipients.map(uid =>
                        (usersMap[uid] && (usersMap[uid].username || usersMap[uid].email)) || "Unknown"
                      ).join(", ")}
                </td>
                <td className="p-2 align-top">
                  {f.recipientGroups.length === 0
                    ? <span className="text-gray-400">None</span>
                    : f.recipientGroups.map(gid =>
                        (groupsMap[gid] && groupsMap[gid].name) || "Unknown"
                      ).join(", ")}
                </td>
                <td className="p-2 align-top whitespace-nowrap">{formatSize(f.metadata?.size ?? 0)}</td>
                <td className="p-2 align-top whitespace-nowrap">{f.metadata?.type || "—"}</td>
                <td className="p-2 align-top whitespace-nowrap">{formatDate(f.metadata?.uploadDate)}</td>
                <td className="p-2 align-top whitespace-nowrap flex flex-row gap-2">
                  <button
                    onClick={() => { setShowConfirm(true); setPendingDelete(f._id); }}
                    className="bg-red-700 hover:bg-red-800 text-white px-2 py-1 rounded"
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        show={showConfirm}
        onClose={() => { setShowConfirm(false); setPendingDelete(null); }}
        onConfirm={() => handleDelete(pendingDelete)}
        title="Delete File"
        message="Are you sure you want to delete this file?"
      />
    </div>
  );
}