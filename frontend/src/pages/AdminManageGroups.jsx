import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import ErrorModal from "../components/ErrorModal";
import { useAuth } from "../context/AuthContext";

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
            className="px-4 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >Confirm</button>
        </div>
      </div>
    </div>
  );
}

/* Modal (unchanged except for using members as ids) */
function GroupModal({ mode, group, users, onClose, onSave }) {
  const ownerRaw = group?.owner;
  const ownerId = typeof ownerRaw === "object" ? ownerRaw?._id : ownerRaw || "";
  const [form, setForm] = useState({ name: group?.name || "", members: [] });

  useEffect(() => {
    const memberIds = mode === "edit"
      ? (group?.members || []).map(m => (typeof m === "object" ? m._id : m)).filter(Boolean)
      : [];
    setForm({
      name: group?.name || "",
      members: memberIds
    });
  }, [group, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const toggleMember = (id) => {
    setForm(f => f.members.includes(id)
      ? { ...f, members: f.members.filter(m => m !== id) }
      : { ...f, members: [...f.members, id] });
  };

  return (
    <div className="fixed z-50 inset-0 bg-black/40 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <h2 className="text-xl font-semibold text-gray-100 mb-4">
          {mode === "edit" ? "Edit Group" : "Create Group"}
        </h2>

        <label className="block text-gray-400 mb-1">Group Name</label>
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          className="w-full mb-4 px-3 py-2 rounded bg-gray-900 text-gray-100 border border-gray-700 focus:border-blue-500 outline-none"
        />

        <label className="block text-gray-400 mb-2">
          Members {mode === "edit" && <span className="text-xs text-gray-500">(excluding owner)</span>}
        </label>
        <div className="max-h-56 overflow-y-auto space-y-1 border border-gray-700 p-2 rounded bg-gray-900 custom-scrollbar">
          {users.map(u => {
            const id = u._id.toString();
            const isOwner = id === ownerId;
            const checked = isOwner ? true : form.members.includes(id);
            return (
              <label key={id} className="flex items-center text-gray-300 text-sm gap-2">
                <input
                  type="checkbox"
                  disabled={isOwner}
                  checked={checked}
                  onChange={() => !isOwner && toggleMember(id)}
                  className="accent-blue-500 disabled:opacity-60"
                />
                <span className="truncate">{u.username || u.email || "NoName"}</span>
                {isOwner && <span className="ml-auto text-xs text-yellow-400 font-semibold">Owner</span>}
              </label>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
          >Cancel</button>
          <button
            type="submit"
            className="px-4 py-1 rounded font-semibold text-white bg-blue-600 hover:bg-blue-700"
          >
            {mode === "edit" ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

const SORT_ICONS = { asc: "▲", desc: "▼", none: "⇅" };

export default function AdminManageGroups() {
  const { user: authUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  // Search & Sort
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  /* Normalization helpers */
  const normalizeGroup = (g) => {
    if (!g) return g;
    const ownerId = typeof g.owner === "object" ? g.owner?._id : g.owner || g.ownerId;
    const memberIds = (g.members || []).map(m => (typeof m === "object" ? m._id : m)).filter(Boolean);
    return {
      ...g,
      owner: ownerId,       // maintain same key for existing code
      ownerId,
      members: memberIds
    };
  };
  const normalizeGroups = (arr) => arr.map(normalizeGroup);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [groupsRes, usersRes] = await Promise.all([
          axios.get("/api/groups/all"),
          axios.get("/api/users/"),
        ]);
        setGroups(normalizeGroups(groupsRes.data));
        setUsers(usersRes.data);
        setUsersMap(Object.fromEntries(usersRes.data.map(u => [String(u._id), u])));
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
      setSortDir(d => d === "asc" ? "desc" : "asc");
    }
  };
  const sortIcon = (field) =>
    sortField === field ? (sortDir === "asc" ? SORT_ICONS.asc : SORT_ICONS.desc) : SORT_ICONS.none;

  function getSortValue(g, field) {
    switch (field) {
      case "name": return (g.name || "").toLowerCase();
      case "owner": {
        const o = usersMap[g.owner];
        return (o && (o.username || o.email) || "").toLowerCase();
      }
      case "members": return g.members?.length || 0;
      case "created": return new Date(g.createdAt || 0).getTime();
      default: return "";
    }
  }

  const filteredSortedGroups = useMemo(() => {
    let data = [...groups];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(g => {
        const ownerName = (() => {
          const o = usersMap[g.owner];
          return (o && (o.username || o.email) || "").toLowerCase();
        })();
        const memberNames = (g.members || [])
          .map(id => {
            const m = usersMap[id];
            return (m && (m.username || m.email) || "").toLowerCase();
          })
          .join(" ");
        return (
          (g.name || "").toLowerCase().includes(q) ||
          ownerName.includes(q) ||
          memberNames.includes(q)
        );
      });
    }
    data.sort((a, b) => {
      const av = getSortValue(a, sortField);
      const bv = getSortValue(b, sortField);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [groups, search, sortField, sortDir, usersMap]);

  const unknownGroups = useMemo(
    () => filteredSortedGroups.filter(g => !usersMap[g.owner]),
    [filteredSortedGroups, usersMap]
  );

  const handleSaveGroup = async (form) => {
    try {
      if (modalMode === "create") {
        const res = await axios.post("/api/groups", {
          name: form.name,
          owner: authUser?._id,
          members: form.members,
        });
        setGroups(g => [...g, normalizeGroup(res.data)]);
      } else if (modalMode === "edit" && editingGroup) {
        if (form.name !== editingGroup.name) {
          await axios.patch(`/api/groups/${editingGroup._id}`, { name: form.name });
        }
        const oldMembers = editingGroup.members.map(String);
        const newMembers = form.members.map(String);
        const removed = oldMembers.filter(id => !newMembers.includes(id));
        if (removed.length) {
          await axios.delete(`/api/groups/${editingGroup._id}/members`, { data: { userIds: removed } });
        }
        const added = newMembers.filter(id => !oldMembers.includes(id));
        if (added.length) {
          await axios.post(`/api/groups/${editingGroup._id}/members`, { userIds: added });
        }
        const updated = await axios.get(`/api/groups/${editingGroup._id}`);
        setGroups(gs => gs.map(g => g._id === editingGroup._id ? normalizeGroup(updated.data) : g));
      }
      setShowModal(false);
      setEditingGroup(null);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not save group.");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await axios.delete(`/api/groups/${groupId}`);
      setGroups(gs => gs.filter(g => g._id !== groupId));
    } catch (err) {
      setError(err?.response?.data?.error || "Could not delete group.");
    }
  };

  const handleDeleteUnknowns = async () => {
    if (!unknownGroups.length) return;
    if (!window.confirm(`Delete ${unknownGroups.length} group(s) with unknown owner? This cannot be undone.`)) return;
    const toDelete = unknownGroups.map(g => g._id);
    const remaining = [...groups];
    for (const id of toDelete) {
      try {
        await axios.delete(`/api/groups/${id}`);
        const idx = remaining.findIndex(g => g._id === id);
        if (idx >= 0) remaining.splice(idx, 1);
      } catch {
        /* ignore individual errors */
      }
    }
    setGroups(remaining);
  };

  const resetAll = () => {
    setSearch("");
    setSortField("name");
    setSortDir("asc");
  };

  if (loading) return <div className="text-center p-8 text-gray-300">Loading...</div>;

  return (
    <div className="p-6 overflow-x-auto custom-scrollbar">
      <ErrorModal message={error} onClose={() => setError("")} />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-200">Manage Groups</h1>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search groups..."
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 focus:border-blue-500 outline-none w-56"
          />
          <button
            onClick={resetAll}
            className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm"
          >
            Reset
          </button>
          <button
            onClick={() => {
              setShowModal(true);
              setModalMode("create");
              setEditingGroup(null);
            }}
            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded"
          >
            + New Group
          </button>
          <button
            onClick={handleDeleteUnknowns}
            disabled={!unknownGroups.length}
            className={`px-4 py-2 rounded text-white text-sm ${
              unknownGroups.length
                ? "bg-red-700 hover:bg-red-800"
                : "bg-red-900 cursor-not-allowed"
            }`}
            title="Delete groups whose owner account is missing"
          >
            Delete Unknowns ({unknownGroups.length})
          </button>
        </div>
      </div>

      <div className="relative max-h-[550px] overflow-y-auto overflow-x-auto rounded-lg border border-gray-700 custom-scrollbar">
        <table className="min-w-full bg-gray-800 text-sm">
          <thead className="sticky top-0 z-10 bg-gray-700">
            <tr className="text-gray-200">
              <th className="p-2 text-left w-1/4">
                <button
                  onClick={() => toggleSort("name")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Group Name <span className="text-xs">{sortIcon("name")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/6">
                <button
                  onClick={() => toggleSort("owner")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Owner <span className="text-xs">{sortIcon("owner")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/3">
                <button
                  onClick={() => toggleSort("members")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Members <span className="text-xs">{sortIcon("members")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSortedGroups.map(g => {
              const owner = usersMap[g.owner];
              return (
                <tr key={g._id} className="border-b border-gray-700 text-gray-200">
                  <td className="p-2 whitespace-nowrap">{g.name}</td>
                  <td className="p-2 whitespace-nowrap">
                    {(owner && (owner.username || owner.email)) ||
                      <span className="text-red-400 font-medium">Unknown</span>}
                  </td>
                  <td className="p-2">
                    {g.members.length === 0
                      ? <span className="text-gray-500">None</span>
                      : g.members.map(uid => {
                          const u = usersMap[uid];
                          return (u && (u.username || u.email)) || "Unknown";
                        }).join(", ")}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingGroup(g);
                          setModalMode("edit");
                          setShowModal(true);
                        }}
                        className="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowConfirm(true);
                          setPendingDelete(g._id);
                        }}
                        className="bg-red-700 hover:bg-red-800 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredSortedGroups.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-400">
                  No groups found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <GroupModal
          mode={modalMode}
          group={editingGroup}
          users={users}
          onClose={() => { setShowModal(false); setEditingGroup(null); }}
          onSave={handleSaveGroup}
        />
      )}

      <ConfirmModal
        show={showConfirm}
        onClose={() => { setShowConfirm(false); setPendingDelete(null); }}
        onConfirm={() => pendingDelete && handleDeleteGroup(pendingDelete)}
        title="Delete Group"
        message="Are you sure you want to delete this group?"
      />
    </div>
  );
}