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

function GroupModal({ mode, group, users, onClose, onSave }) {
  const [form, setForm] = useState({
    name: group?.name || "",
    owner: group?.owner || (users.length ? users[0]._id : ""),
    members: [],
  });

  useEffect(() => {
    const initialOwner = group?.owner || (users.length ? users[0]._id : "");
    const initialMembers = group?.members
      ? [...group.members.map(String)]
      : users.filter(u => u._id !== initialOwner).map(u => u._id.toString());

    setForm({
      name: group?.name || "",
      owner: initialOwner,
      members: initialMembers,
    });
  }, [group, users]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => {
      // If owner changes, remove them from members if already included
      if (name === "owner") {
        return {
          ...f,
          owner: value,
          members: f.members.filter(m => m !== value),
        };
      }
      return { ...f, [name]: value };
    });
  };

  const handleMemberToggle = (id) => {
    setForm(f => ({
      ...f,
      members: f.members.includes(id)
        ? f.members.filter(m => m !== id)
        : [...f.members, id],
    }));
  };

  const isSubmitDisabled = () => {
    const hasMembers = form.members.length > 0;
    const ownerIncluded = form.members.includes(form.owner);
    return !hasMembers && !ownerIncluded;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitDisabled()) return;
    onSave(form);
  };

  return (
    <div className="fixed z-50 inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">{mode === "edit" ? "Edit Group" : "Create Group"}</h2>

        <label className="block text-gray-400 mb-1">Group Name</label>
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-900 text-gray-200 border border-gray-700 focus:border-blue-400 outline-none"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label className="block text-gray-400 mb-1">Owner</label>
        <select
          name="owner"
          className="w-full mb-3 px-2 py-1 rounded bg-gray-900 text-gray-200 border border-gray-700"
          value={form.owner}
          onChange={handleChange}
          required
        >
          {users.map(u => (
            <option key={u._id} value={u._id}>
              {u.username || u.email || "NoName"}
            </option>
          ))}
        </select>

        <label className="block text-gray-400 mb-2">Members</label>
        <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-700 p-2 rounded bg-gray-900 custom-scrollbar">
          {users.map(u => (
            <label key={u._id} className="flex items-center text-gray-300 text-sm gap-2">
              <input
                type="checkbox"
                checked={!form.members.includes(u._id.toString())}
                onChange={() => handleMemberToggle(u._id.toString())}
                className="accent-blue-500"
              />
              {u.username || u.email || "NoName"}
              {u._id === form.owner && <span className="ml-auto text-xs text-yellow-400">(Owner)</span>}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600">Cancel</button>
          <button
            type="submit"
            disabled={isSubmitDisabled()}
            className={`px-4 py-1 rounded font-semibold text-white transition ${
              isSubmitDisabled() ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {mode === "edit" ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminManageGroups() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // or "edit"
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [groupsRes, usersRes] = await Promise.all([
          axios.get("/api/groups/all"),
          axios.get("/api/users/"),
        ]);
        setGroups(groupsRes.data);
        setUsers(usersRes.data);
        setUsersMap(Object.fromEntries(usersRes.data.map(u => [String(u._id), u])));
      } catch (err) {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Create or Edit Group
  const handleSaveGroup = async (form) => {
    try {
      if (modalMode === "create") {
        const res = await axios.post("/api/groups", {
          name: form.name,
          owner: form.owner,
          members: form.members,
        });
        setGroups(groups => [...groups, res.data]);
      } else if (modalMode === "edit" && editingGroup) {
        const res = await axios.patch(`/api/groups/${editingGroup._id}`, {
          name: form.name,
        });
        // Update members: diff old/new for add/remove
        // Remove old not in new
        const removedMembers = editingGroup.members.filter(
          id => !form.members.includes(String(id))
        );
        if (removedMembers.length)
          await axios.delete(`/api/groups/${editingGroup._id}/members`, { data: { userIds: removedMembers } });
        // Add new not in old
        const addedMembers = form.members.filter(
          id => !editingGroup.members.map(String).includes(String(id))
        );
        if (addedMembers.length)
          await axios.post(`/api/groups/${editingGroup._id}/members`, { userIds: addedMembers });
        // Update state
        setGroups(groups =>
          groups.map(g =>
            g._id === editingGroup._id
              ? { ...g, name: form.name, owner: form.owner, members: form.members }
              : g
          )
        );
      }
      setShowModal(false);
      setEditingGroup(null);
    } catch {
      setError("Could not save group.");
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId) => {
    try {
      await axios.delete(`/api/groups/${groupId}`);
      setGroups(groups => groups.filter(g => g._id !== groupId));
    } catch {
      setError("Could not delete group.");
    }
  };

  if (loading) return <div className="text-center p-8 text-gray-300">Loading...</div>;
  if (error) return <div className="text-center text-red-400">{error}</div>;

  return (
    <div className="p-6 overflow-x-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-200">Manage Groups</h1>
        <button
          className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded"
          onClick={() => { setShowModal(true); setModalMode("create"); setEditingGroup(null); }}
        >+ New Group</button>
      </div>
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="min-w-full bg-gray-800 rounded-lg shadow table-fixed">
          <thead>
            <tr className="bg-gray-700 text-gray-200">
              <th className="p-2 font-semibold text-left w-1/4 whitespace-nowrap">Group Name</th>
              <th className="p-2 font-semibold text-left w-1/6 whitespace-nowrap">Owner</th>
              <th className="p-2 font-semibold text-left w-1/3 whitespace-nowrap">Members</th>
              <th className="p-2 font-semibold text-left w-1/6 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <tr key={g._id} className="border-b border-gray-700 text-gray-200 align-top">
                <td className="p-2 whitespace-nowrap align-top">{g.name}</td>
                <td className="p-2 whitespace-nowrap align-top">
                  {(usersMap[g.owner] && (usersMap[g.owner].username || usersMap[g.owner].email)) || <span className="text-gray-400">Unknown</span>}
                </td>
                <td className="p-2 align-top">
                  {g.members.length === 0
                    ? <span className="text-gray-400">None</span>
                    : (
                      <span>
                        {g.members.map(uid =>
                          (usersMap[uid] && (usersMap[uid].username || usersMap[uid].email)) || "Unknown"
                        ).join(", ")}
                      </span>
                    )}
                </td>
                <td className="p-2 align-top whitespace-nowrap flex flex-row gap-2">
                  <button
                    onClick={() => { setEditingGroup(g); setModalMode("edit"); setShowModal(true); }}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded"
                  >Edit</button>
                  <button
                    onClick={() => { setShowConfirm(true); setPendingDelete(g._id); }}
                    className="bg-red-700 hover:bg-red-800 text-white px-2 py-1 rounded"
                  >Delete</button>
                </td>
              </tr>
            ))}
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
        onConfirm={() => { handleDeleteGroup(pendingDelete); }}
        title="Delete Group"
        message="Are you sure you want to delete this group?"
      />
    </div>
  );
}