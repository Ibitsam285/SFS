import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import ErrorModal from "../components/ErrorModal";

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

function EditUserModal({ user, onClose, onSave, groups }) {
  const [form, setForm] = useState({
    username: user.username || "",
    email: user.email || "",
    groups: user.groups?.map(id => String(id)) || [],
  });

  useEffect(() => {
    setForm({
      username: user.username || "",
      email: user.email || "",
      groups: user.groups?.map(id => String(id)) || [],
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleMultiChange = (name, values) => {
    setForm(f => ({ ...f, [name]: values }));
  };

  const handleSelectChange = (e) => {
    const { name, options } = e.target;
    const values = Array.from(options)
      .filter(opt => opt.selected)
      .map(opt => opt.value);
    handleMultiChange(name, values);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      groups: form.groups,
    });
  };

  if (!user) return null;
  return (
    <div className="fixed z-50 inset-0 bg-black bg-opacity-20 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Edit User</h2>
        <label className="block text-gray-400 mb-1">Username</label>
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-900 text-gray-200 border border-gray-700 focus:border-blue-400 outline-none"
          name="username"
          value={form.username}
          onChange={handleChange}
        />
        <label className="block text-gray-400 mb-1">Email</label>
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-900 text-gray-200 border border-gray-700 focus:border-blue-400 outline-none"
          name="email"
          value={form.email}
          onChange={handleChange}
        />
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="px-4 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600">Cancel</button>
          <button type="submit" className="px-4 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">Save</button>
        </div>
      </form>
    </div>
  );
}

const SORT_ICONS = {
  asc: "▲",
  desc: "▼",
  none: "⇅"
};

export default function AdminManageUsers() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupsMap, setGroupsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);

  // Search + sort state
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("asc"); // asc | desc
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [usersRes, groupsRes] = await Promise.all([
          axios.get("/api/users/"),
          axios.get("/api/groups/all"),
        ]);
        setUsers(usersRes.data);
        setGroups(groupsRes.data);
        setGroupsMap(Object.fromEntries(groupsRes.data.map(g => [String(g._id), g.name])));
      } catch (err) {
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

  const sortedFilteredUsers = useMemo(() => {
    let data = [...users];

    // Role filter
    if (roleFilter) {
      data = data.filter(u => u.role === roleFilter);
    }

    // Search across username, email, role, groups
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(u => {
        const username = (u.username || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const role = (u.role || "").toLowerCase();
        const groupNames = (u.groups || [])
          .map(gid => (groupsMap[gid] || "").toLowerCase())
          .join(" ");
        return (
          username.includes(q) ||
          email.includes(q) ||
          role.includes(q) ||
          groupNames.includes(q)
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
  }, [users, search, sortField, sortDir, groupsMap, roleFilter]);

  function getSortValue(u, field) {
    switch (field) {
      case "username": return (u.username || "").toLowerCase();
      case "email": return (u.email || "").toLowerCase();
      case "role": return (u.role || "").toLowerCase();
      case "groups": return (u.groups || [])
        .map(gid => (groupsMap[gid] || "").toLowerCase())
        .sort()
        .join(",");
      default: return "";
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete user?")) return;
    try {
      await axios.delete(`/api/users/${userId}`);
      setUsers(users => users.filter(u => u._id !== userId));
    } catch {
      setError("Could not delete user.");
    }
  };

  const handleRoleChange = (userId, oldRole, newRole) => {
    if (oldRole === newRole) return;
    setPendingRoleChange({ userId, newRole });
    setShowConfirm(true);
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    try {
      await axios.patch(`/api/users/${pendingRoleChange.userId}/role`, { role: pendingRoleChange.newRole });
      setUsers(users =>
        users.map(u => u._id === pendingRoleChange.userId ? { ...u, role: pendingRoleChange.newRole } : u)
      );
    } catch {
      setError("Could not change role.");
    } finally {
      setPendingRoleChange(null);
    }
  };

  const handleEditSave = async (form) => {
    try {
      await axios.patch(`/api/users/${editingUser._id}`, {
        username: form.username,
        email: form.email
      });
      setUsers(users =>
        users.map(u => u._id === editingUser._id ? { ...u, ...form } : u)
      );
      setEditingUser(null);
    } catch {
      setError("Could not update user.");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
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
        <h1 className="text-2xl font-bold text-gray-200">Manage Users</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-400 focus:border-blue-500 outline-none w-56"
          />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 focus:border-blue-500 outline-none"
          >
            <option value="">All Roles</option>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
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
                  onClick={() => toggleSort("username")}
                  className="flex items-center gap-1 font-semibold"
                  title="Sort by username"
                >
                  Username <span className="text-xs">{sortIcon("username")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/6">
                <button
                  onClick={() => toggleSort("email")}
                  className="flex items-center gap-1 font-semibold"
                  title="Sort by email"
                >
                  Email <span className="text-xs">{sortIcon("email")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/12">
                <button
                  onClick={() => toggleSort("role")}
                  className="flex items-center gap-1 font-semibold"
                  title="Sort by role"
                >
                  Role <span className="text-xs">{sortIcon("role")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/4">
                <button
                  onClick={() => toggleSort("groups")}
                  className="flex items-center gap-1 font-semibold"
                  title="Sort by groups"
                >
                  Groups <span className="text-xs">{sortIcon("groups")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedFilteredUsers.map(u => (
              <tr key={u._id} className="border-b border-gray-700 text-gray-200">
                <td className="p-2 whitespace-nowrap">{u.username || <span className="text-gray-500">None</span>}</td>
                <td className="p-2 whitespace-nowrap">{u.email || <span className="text-gray-500">None</span>}</td>
                <td className="p-2 whitespace-nowrap">
                  <span>{u.role}</span>
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u._id, u.role, e.target.value)}
                    className="ml-2 bg-gray-900 text-gray-200 border border-gray-600 rounded px-1 py-0.5"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="p-2">
                  {u.groups.length === 0
                    ? <span className="text-gray-500">None</span>
                    : u.groups.map(gid => groupsMap[String(gid)] || "—").join(", ")}
                </td>
                <td className="p-2 whitespace-nowrap flex gap-2">
                  <button
                    onClick={() => setEditingUser(u)}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded"
                  >Edit</button>
                  <button
                    onClick={() => handleDelete(u._id)}
                    className="bg-red-700 hover:bg-red-800 text-white px-2 py-1 rounded"
                  >Delete</button>
                </td>
              </tr>
            ))}
            {sortedFilteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        show={showConfirm}
        onClose={() => { setShowConfirm(false); setPendingRoleChange(null); }}
        onConfirm={confirmRoleChange}
        title="Change Role Confirmation"
        message={`Are you sure you want to ${
          pendingRoleChange?.newRole === "admin" ? "promote" : "set role to"
        } "${pendingRoleChange?.newRole}"?`}
      />

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}