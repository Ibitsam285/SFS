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
        <label className="block text-gray-400 mb-1">Groups</label>
        <select
          multiple
          name="groups"
          className="custom-scrollbar w-full mb-3 px-2 py-1 rounded bg-gray-900 text-gray-200 border border-gray-700"
          value={form.groups}
          onChange={handleSelectChange}
        >
          {groups.length === 0 ?
            <option disabled>No groups</option> :
            groups.map(g => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
        </select>
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="px-4 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600">Cancel</button>
          <button type="submit" className="px-4 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">Save</button>
        </div>
      </form>
    </div>
  );
}

export default function AdminManageUsers() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupsMap, setGroupsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);

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
        users.map(u =>
          u._id === editingUser._id
            ? { ...u, ...form }
            : u
        )
      );
      setEditingUser(null);
    } catch (error) {
      setError("Could not update user.");
    }
  };

  if (loading) return <div className="text-center p-8 text-gray-300">Loading...</div>;
  if (error) return <div className="text-center text-red-400">{error}</div>;

  return (
    <div className="p-6 overflow-x-auto custom-scrollbar">
      <h1 className="text-2xl font-bold mb-4 text-gray-200">Manage Users</h1>
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="min-w-full bg-gray-800 rounded-lg shadow table-fixed">
          <thead>
            <tr className="bg-gray-700 text-gray-200">
              <th className="p-2 font-semibold text-left w-1/6 whitespace-nowrap">Username</th>
              <th className="p-2 font-semibold text-left w-1/6 whitespace-nowrap">Email</th>
              <th className="p-2 font-semibold text-left w-1/12 whitespace-nowrap">Role</th>
              <th className="p-2 font-semibold text-left w-1/4 whitespace-nowrap">Groups</th>
              <th className="p-2 font-semibold text-left w-1/6 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="border-b border-gray-700 text-gray-200 align-top">
                <td className="p-2 whitespace-nowrap align-top">{u.username || <span className="text-gray-400">None</span>}</td>
                <td className="p-2 whitespace-nowrap align-top">{u.email || <span className="text-gray-400">None</span>}</td>
                <td className="p-2 whitespace-nowrap align-top">
                  <span className="inline-block">{u.role}</span>
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u._id, u.role, e.target.value)}
                    className="ml-2 bg-gray-900 text-gray-200 border border-gray-700 rounded px-1 py-0.5"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="p-2 align-top">
                  {u.groups.length === 0 ? (
                    <span className="text-gray-400">None</span>
                  ) : (
                    <span>
                      {u.groups
                        .map(gid => groupsMap[String(gid)] || "—")
                        .join(", ")}
                    </span>
                  )}
                </td>
                <td className="p-2 align-top whitespace-nowrap flex flex-row gap-2">
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
          </tbody>
        </table>
      </div>

      <ConfirmModal
        show={showConfirm}
        onClose={() => { setShowConfirm(false); setPendingRoleChange(null); }}
        onConfirm={confirmRoleChange}
        title="Change Role Confirmation"
        message={`Are you sure you want to ${pendingRoleChange?.newRole === "admin" ? "promote" : "demote"} this user to "${pendingRoleChange?.newRole}"?`}
      />

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditSave}
          groups={groups}
        />
      )}
    </div>
  );
}