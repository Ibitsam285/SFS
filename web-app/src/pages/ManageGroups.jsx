import { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

async function fetchFilesInGroup(groupId) {
    try {
        const res = await api.get(`/files?group=${groupId}`);
        return res.data;
    } catch {
        return [];
    }
}

function ManageGroups() {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [files, setFiles] = useState([]);
    const [status, setStatus] = useState("");
    const [createName, setCreateName] = useState("");
    const [createStatus, setCreateStatus] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [userResults, setUserResults] = useState([]);
    const [addUserIds, setAddUserIds] = useState([]);
    const [editingName, setEditingName] = useState("");
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        api.get("/groups").then(res => setGroups(res.data));
    }, []);

    useEffect(() => {
        if (!selectedGroup) return setFiles([]);
        fetchFilesInGroup(selectedGroup._id).then(setFiles);
    }, [selectedGroup]);

    const handleSelectGroup = async (group) => {
        setStatus("");
        try {
            const res = await api.get(`/groups/${group._id}`);
            setSelectedGroup(res.data);
            setEditMode(false);
            setEditingName(res.data.name);
            setFiles([]);
            fetchFilesInGroup(res.data._id).then(setFiles);
        } catch (err) {
            setStatus("Failed to load group: " + (err.response?.data?.error || err.message));
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        setCreateStatus("");
        try {
            const res = await api.post("/groups", { name: createName });
            setGroups(g => [...g, res.data]);
            setCreateName("");
            setCreateStatus("Created!");
        } catch (err) {
            setCreateStatus("Failed: " + (err.response?.data?.error || err.message));
        }
    };

    const handleRename = async (e) => {
    e.preventDefault();
    try {
        await api.patch(`/groups/${selectedGroup._id}`, { name: editingName });
        const res = await api.get(`/groups/${selectedGroup._id}`);
        setSelectedGroup(res.data);
        setGroups(gs =>
            gs.map(g => g._id === res.data._id ? { ...g, name: res.data.name } : g)
        );
        setEditMode(false);
        setStatus("Renamed!");
    } catch (err) {
        setStatus("Rename failed: " + (err.response?.data?.error || err.message));
    }
};

    const handleDelete = async () => {
        if (!window.confirm("Delete this group?")) return;
        try {
            await api.delete(`/groups/${selectedGroup._id}`);
            setGroups(gs => gs.filter(g => g._id !== selectedGroup._id));
            setSelectedGroup(null);
            setFiles([]);
            setStatus("");
        } catch (err) {
            setStatus("Delete failed: " + (err.response?.data?.error || err.message));
        }
    };

    const handleSearchUsers = async (e) => {
        e.preventDefault();
        setStatus("Searching...");
        try {
            const res = await api.get(`/users/search/${encodeURIComponent(searchTerm)}`);
            const excludeIds = selectedGroup.members.map(m => m._id).concat(selectedGroup.owner._id);
            setUserResults(res.data.filter(u => !excludeIds.includes(u._id)));
            setStatus("");
        } catch (err) {
            setUserResults([]);
            setStatus("Search failed.");
        }
    };

    const handleAddMembers = async () => {
        if (!addUserIds.length) return;
        try {
            await api.post(`/groups/${selectedGroup._id}/members`, {
                userIds: addUserIds,
            });

            const res = await api.get(`/groups/${selectedGroup._id}`);
            setSelectedGroup(res.data);

            setAddUserIds([]);
            setUserResults([]);
            setSearchTerm("");
        } catch (err) {
            setStatus("Add failed: " + (err.response?.data?.error || err.message));
        }
    };


    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Remove this member from group?")) return;
        try {
            await api.delete(`/groups/${selectedGroup._id}/members`, {
                data: { userIds: [userId] },
            });

            const res = await api.get(`/groups/${selectedGroup._id}`);
            setSelectedGroup(res.data);
        } catch (err) {
            setStatus("Remove failed: " + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-8">
            <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">Manage Groups</h2>
            <div className="flex flex-wrap gap-8 ">
                {/* Group List */}
                <div className="w-68 bg-gray-900 rounded-lg p-4 shadow">
                    <div className="mb-4">
                        <form onSubmit={handleCreateGroup} className="flex gap-2">
                            <input
                                type="text"
                                value={createName}
                                onChange={e => setCreateName(e.target.value)}
                                className="bg-gray-800 text-gray-200 rounded p-2 flex-1"
                                placeholder="New group name"
                                required
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                            >
                                +
                            </button>
                        </form>
                        {createStatus && <div className="text-green-400 text-xs">{createStatus}</div>}
                    </div>
                    <div className="font-semibold text-gray-300 mb-2 pl-1">Your Groups</div>
                    <ul>
                        {groups.map(g => (
                            <li
                                key={g._id}
                                className={`cursor-pointer p-2 rounded ${selectedGroup && g._id === selectedGroup._id ? "bg-blue-700 text-white" : "hover:bg-gray-800 text-gray-300"}`}
                                onClick={() => handleSelectGroup(g)}
                            >
                                {g.name}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Group Details */}
                <div className="flex-1 bg-gray-900 rounded-lg p-6 shadow">
                    {!selectedGroup ? (
                        <div className="text-gray-400 text-center mt-10">Select a group to view details.</div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                {editMode ? (
                                    <form onSubmit={handleRename} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={e => setEditingName(e.target.value)}
                                            className="bg-gray-800 text-gray-200 rounded p-2"
                                        />
                                        <button type="submit" className="bg-green-600 px-3 py-1 rounded text-white">Save</button>
                                        <button type="button" className="bg-gray-700 px-3 py-1 rounded text-white" onClick={() => setEditMode(false)}>Cancel</button>
                                    </form>
                                ) : (
                                    <>
                                        <h3 className="text-xl font-bold text-blue-300">{selectedGroup.name}</h3>
                                        {(selectedGroup.owner._id === user._id || user.role === "admin") && (
                                            <div className="flex gap-2">
                                                <button className="bg-blue-600 px-3 py-1 rounded text-white" onClick={() => setEditMode(true)}>Rename</button>
                                                <button className="bg-red-600 px-3 py-1 rounded text-white" onClick={handleDelete}>Delete</button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="mb-4">
                                <span className="font-semibold text-gray-300">Owner:</span> <span className="font-bold text-white">{selectedGroup.owner.username ? selectedGroup.owner.username : selectedGroup.owner.email} </span>
                            </div>
                            <div className="mb-4">
                                <div className="font-semibold text-gray-300 mb-1">Members:</div>
                                <ul>
                                    {selectedGroup.members.map(m => (
                                        <li key={m._id} className="flex items-center gap-2 pb-2">
                                            <span className="font-semibold text-amber-100"> {m.username ? m.username : m.email} </span>
                                            {(selectedGroup.owner._id === user._id || user.role === "admin") && m._id !== selectedGroup.owner._id && (
                                                <button
                                                    className="bg-red-700 hover:bg-red-800 text-white px-2 py-1 rounded text-xs"
                                                    onClick={() => handleRemoveMember(m._id)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {(selectedGroup.owner._id === user._id || user.role === "admin") && (
                                <div className="mb-4">
                                    <form onSubmit={handleSearchUsers} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="bg-gray-800 text-gray-100 rounded p-2 flex-1"
                                            placeholder="Search users to add"
                                        />
                                        <button type="submit" className="bg-blue-700 text-white px-3 py-1 rounded">Search</button>
                                    </form>
                                    {userResults.length > 0 && (
                                        <div className="bg-gray-800 rounded p-2 mb-2 max-h-36 overflow-auto">
                                            {userResults.map(u => (
                                                <label key={u._id} className="block text-gray-100 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={addUserIds.includes(u._id)}
                                                        onChange={e => {
                                                            if (e.target.checked)
                                                                setAddUserIds(ids => [...ids, u._id]);
                                                            else
                                                                setAddUserIds(ids => ids.filter(id => id !== u._id));
                                                        }}
                                                        className="mr-2"
                                                    />
                                                    {u.username || u.email}
                                                </label>
                                            ))}
                                            <button
                                                type="button"
                                                className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded mt-2"
                                                disabled={addUserIds.length === 0}
                                                onClick={handleAddMembers}
                                            >
                                                Add Selected
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-4">
                                <div className="font-semibold text-gray-300 mb-1">Files in this group:</div>
                                {files.length === 0 ? (
                                    <div className="text-gray-400">No files in this group.</div>
                                ) : (
                                    <ul className="list-disc pl-5 text-gray-200">
                                        {files.map(f => (
                                            <li key={f._id}>{f.filename}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            {status && <div className="text-gray-300 mt-2">{status}</div>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ManageGroups;