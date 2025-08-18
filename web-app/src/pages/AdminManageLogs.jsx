import { useEffect, useState } from "react";
import axios from "axios";

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const sortLogList = (logs, sortBy, sortOrder) => {
  const sorted = [...logs];
  sorted.sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case "actor":
        aVal = a._actorName || "";
        bVal = b._actorName || "";
        break;
      case "action":
        aVal = a.action || "";
        bVal = b.action || "";
        break;
      case "targetType":
        aVal = a.targetType || "";
        bVal = b.targetType || "";
        break;
      case "timestamp":
        aVal = new Date(a.timestamp);
        bVal = new Date(b.timestamp);
        break;
      default:
        aVal = a.timestamp;
        bVal = b.timestamp;
    }
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
  return sorted;
};

export default function AdminManageLogs() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterAction, setFilterAction] = useState("");
  const [filterActor, setFilterActor] = useState("");
  const [filterTargetType, setFilterTargetType] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [logsRes, usersRes] = await Promise.all([
          axios.get("/api/logs/all"),
          axios.get("/api/users/"),
        ]);
        setLogs(logsRes.data);
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

  // Prepare logs with actor names for sorting/filtering
  const logsWithActor = logs.map(log => ({
    ...log,
    _actorName: (usersMap[log.actorId] && (usersMap[log.actorId].username || usersMap[log.actorId].email)) || "Unknown"
  }));

  // Unique action types, actors, targets for filters
  const actions = Array.from(new Set(logs.map(l => l.action))).sort();
  const actors = Array.from(new Set(logsWithActor.map(l => l._actorName))).sort();
  const targetTypes = Array.from(new Set(logs.map(l => l.targetType))).sort();

  // Apply filters
  let filteredLogs = logsWithActor;
  if (filterAction) filteredLogs = filteredLogs.filter(l => l.action === filterAction);
  if (filterActor) filteredLogs = filteredLogs.filter(l => l._actorName === filterActor);
  if (filterTargetType) filteredLogs = filteredLogs.filter(l => l.targetType === filterTargetType);

  // Sort
  const sortedLogs = sortLogList(filteredLogs, sortBy, sortOrder);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(order => order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  if (loading) return <div className="text-center p-8 text-gray-300">Loading...</div>;
  if (error) return <div className="text-center text-red-400">{error}</div>;

  return (
    <div className="p-6 overflow-x-auto custom-scrollbar">
      <h1 className="text-2xl font-bold mb-4 text-gray-200">Audit Logs</h1>
      <div className="flex flex-wrap gap-4 mb-3 items-center">
        <span className="text-gray-300">Filter:</span>
        <select
          className="px-2 py-1 rounded bg-gray-900 text-gray-200 border border-gray-700"
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
        >
          <option value="">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          className="px-2 py-1 rounded bg-gray-900 text-gray-200 border border-gray-700"
          value={filterActor}
          onChange={e => setFilterActor(e.target.value)}
        >
          <option value="">All Actors</option>
          {actors.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          className="px-2 py-1 rounded bg-gray-900 text-gray-200 border border-gray-700"
          value={filterTargetType}
          onChange={e => setFilterTargetType(e.target.value)}
        >
          <option value="">All Target Types</option>
          {targetTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          className="px-3 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
          onClick={() => { setFilterAction(""); setFilterActor(""); setFilterTargetType(""); }}
        >
          Clear Filters
        </button>
      </div>
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="min-w-full bg-gray-800 rounded-lg shadow table-fixed">
          <thead>
            <tr className="bg-gray-700 text-gray-200">
              <th className="p-2 text-left whitespace-nowrap w-1/6 cursor-pointer" onClick={() => handleSort("timestamp")}>
                Timestamp {sortBy === "timestamp" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th className="p-2 text-left whitespace-nowrap w-1/5 cursor-pointer" onClick={() => handleSort("actor")}>
                Actor {sortBy === "actor" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th className="p-2 text-left whitespace-nowrap w-1/6 cursor-pointer" onClick={() => handleSort("action")}>
                Action {sortBy === "action" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th className="p-2 text-left whitespace-nowrap w-1/6 cursor-pointer" onClick={() => handleSort("targetType")}>
                Target Type {sortBy === "targetType" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th className="p-2 text-left whitespace-nowrap w-1/3">Target ID</th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.map(log => (
              <tr key={log._id} className="border-b border-gray-700 text-gray-200 align-top">
                <td className="p-2 align-top whitespace-nowrap">{formatDate(log.timestamp)}</td>
                <td className="p-2 align-top whitespace-nowrap">{log._actorName}</td>
                <td className="p-2 align-top whitespace-nowrap">{log.action}</td>
                <td className="p-2 align-top whitespace-nowrap">{log.targetType}</td>
                <td className="p-2 align-top whitespace-nowrap">{log.targetId}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedLogs.length === 0 && (
          <div className="text-center text-gray-300 py-8">No logs found.</div>
        )}
      </div>
    </div>
  );
}