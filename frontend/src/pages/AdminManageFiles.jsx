import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import ErrorModal from "../components/ErrorModal";

function ConfirmModal({ show, onClose, onConfirm, title, message }) {
  if (!show) return null;
  return (
    <div className="fixed z-50 inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm border border-gray-700">
        <div className="text-lg font-semibold text-gray-100 mb-2">{title}</div>
        <div className="text-gray-300 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
          >Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-4 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
          >Confirm</button>
        </div>
      </div>
    </div>
  );
}

const SORT_ICONS = { asc: "▲", desc: "▼", none: "⇅" };

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return bytes + " B";
  const units = ["KB","MB","GB","TB"];
  let i = -1;
  let val = bytes;
  do {
    val /= 1024;
    i++;
  } while (val >= 1024 && i < units.length - 1);
  return val.toFixed(1) + " " + units[i];
}

function formatDate(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return "—";
  }
}

export default function AdminManageFiles() {
  const [files, setFiles] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [groupsMap, setGroupsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  // Search + sort
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("asc");

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
        setUsersMap(Object.fromEntries(usersRes.data.map(u => [String(u._id), u])));
        setGroupsMap(Object.fromEntries(groupsRes.data.map(g => [String(g._id), g])));
      } catch {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else {
      setSortDir(prev => prev === "asc" ? "desc" : prev === "desc" ? "asc" : "asc");
    }
  };

  function getSortValue(f, field) {
    switch (field) {
      case "filename": return (f.filename || "").toLowerCase();
      case "owner": {
        const o = usersMap[f.ownerId];
        return (o && (o.username || o.email) || "").toLowerCase();
      }
      case "recipients": {
        return (f.recipients || [])
          .map(id => {
            const u = usersMap[id];
            return (u && (u.username || u.email) || "").toLowerCase();
          })
          .sort()
          .join(",");
      }
      case "groups": {
        return (f.recipientGroups || [])
          .map(id => (groupsMap[id]?.name || "").toLowerCase())
          .sort()
          .join(",");
      }
      case "size": return f.metadata?.size || 0;
      case "type": return (f.metadata?.type || "").toLowerCase();
      case "uploaded": return new Date(f.metadata?.uploadDate || 0).getTime();
      default: return "";
    }
  }

  const filteredSortedFiles = useMemo(() => {
    let data = [...files];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(f => {
        const fn = (f.filename || "").toLowerCase();
        const ownerName = (() => {
          const o = usersMap[f.ownerId];
            return (o && (o.username || o.email) || "").toLowerCase();
        })();
        const recipients = (f.recipients || [])
          .map(id => {
            const u = usersMap[id];
            return (u && (u.username || u.email) || "").toLowerCase();
          }).join(" ");
        const groups = (f.recipientGroups || [])
          .map(id => (groupsMap[id]?.name || "").toLowerCase())
          .join(" ");
        const type = (f.metadata?.type || "").toLowerCase();
        return (
          fn.includes(q) ||
          ownerName.includes(q) ||
          recipients.includes(q) ||
          groups.includes(q) ||
          type.includes(q)
        );
      });
    }
    if (sortField) {
      data.sort((a, b) => {
        const av = getSortValue(a, sortField);
        const bv = getSortValue(b, sortField);
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [files, search, sortField, sortDir, usersMap, groupsMap]);

  const handleDelete = async (fileId) => {
    if (!window.confirm("Delete file?")) return;
    try {
      await axios.delete(`/api/files/${fileId}`);
      setFiles(files => files.filter(f => f._id !== fileId));
    } catch {
      setError("Could not delete file.");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSortField("");
    setSortDir("asc");
  };

  if (loading) return <div className="text-center p-8 text-gray-300">Loading...</div>;

  const sortIcon = (field) => {
    if (sortField !== field) return SORT_ICONS.none;
    return sortDir === "asc" ? SORT_ICONS.asc : SORT_ICONS.desc;
  };

  return (
    <div className="p-6 overflow-x-auto custom-scrollbar">
      <ErrorModal message={error} onClose={() => setError("")} />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-200">Manage Files</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files..."
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-400 focus:border-blue-500 outline-none w-60"
          />
          <button
            onClick={resetFilters}
            className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm"
          >Reset</button>
        </div>
      </div>

      <div className="relative max-h-[550px] overflow-y-auto overflow-x-auto rounded-lg border border-gray-700 custom-scrollbar">
        <table className="min-w-full bg-gray-800 text-sm">
          <thead className="sticky top-0 z-10 bg-gray-700">
            <tr className="text-gray-200">
              <th className="p-2 text-left w-1/6">
                <button
                  onClick={() => toggleSort("filename")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Filename <span className="text-xs">{sortIcon("filename")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/7">
                <button
                  onClick={() => toggleSort("owner")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Owner <span className="text-xs">{sortIcon("owner")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/6">
                <button
                  onClick={() => toggleSort("recipients")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Recipients <span className="text-xs">{sortIcon("recipients")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/6">
                <button
                  onClick={() => toggleSort("groups")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Groups <span className="text-xs">{sortIcon("groups")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/12">
                <button
                  onClick={() => toggleSort("size")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Size <span className="text-xs">{sortIcon("size")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/12">
                <button
                  onClick={() => toggleSort("type")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Type <span className="text-xs">{sortIcon("type")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/8">
                <button
                  onClick={() => toggleSort("uploaded")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Uploaded <span className="text-xs">{sortIcon("uploaded")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/12">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSortedFiles.map(f => {
              const owner = usersMap[f.ownerId];
              return (
                <tr key={f._id} className="border-b border-gray-700 text-gray-200">
                  <td className="p-2 whitespace-nowrap">{f.filename}</td>
                  <td className="p-2 whitespace-nowrap">
                    {(owner && (owner.username || owner.email)) || <span className="text-gray-500">Unknown</span>}
                  </td>
                  <td className="p-2">
                    {f.recipients.length === 0
                      ? <span className="text-gray-500">None</span>
                      : f.recipients.map(uid => {
                          const u = usersMap[uid];
                          return (u && (u.username || u.email)) || "Unknown";
                        }).join(", ")}
                  </td>
                  <td className="p-2">
                    {f.recipientGroups.length === 0
                      ? <span className="text-gray-500">None</span>
                      : f.recipientGroups.map(gid => (groupsMap[gid]?.name || "Unknown")).join(", ")}
                  </td>
                  <td className="p-2 whitespace-nowrap">{formatSize(f.metadata?.size ?? 0)}</td>
                  <td className="p-2 whitespace-nowrap">{f.metadata?.type || "—"}</td>
                  <td className="p-2 whitespace-nowrap">{formatDate(f.metadata?.uploadDate)}</td>
                  <td className="p-2 whitespace-nowrap">
                    <button
                      onClick={() => { setShowConfirm(true); setPendingDelete(f._id); }}
                      className="bg-red-700 hover:bg-red-800 text-white px-2 py-1 rounded"
                    >Delete</button>
                  </td>
                </tr>
              );
            })}
            {filteredSortedFiles.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-400">
                  No files found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        show={showConfirm}
        onClose={() => { setShowConfirm(false); setPendingDelete(null); }}
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
        title="Delete File"
        message="Are you sure you want to delete this file?"
      />
    </div>
  );
}