import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import ErrorModal from "../components/ErrorModal";

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "—";
  }
}

const SORT_ICONS = { asc: "▲", desc: "▼", none: "⇅" };

export default function AdminManageLogs() {
  const [logs, setLogs] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters / search / sort
  const [filterAction, setFilterAction] = useState("");
  const [filterActor, setFilterActor] = useState("");
  const [filterTargetType, setFilterTargetType] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("timestamp"); // timestamp | actor | action | targetType | targetId
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [logsRes, usersRes] = await Promise.all([
          axios.get("/api/logs/all"),
          axios.get("/api/users/"),
        ]);
        setLogs(logsRes.data);
        setUsersMap(Object.fromEntries(usersRes.data.map(u => [String(u._id), u])));
      } catch {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const logsEnriched = useMemo(() => {
    return logs.map(l => ({
      ...l,
      _actorName: (usersMap[l.actorId] && (usersMap[l.actorId].username || usersMap[l.actorId].email)) || "Unknown"
    }));
  }, [logs, usersMap]);

  const actions = useMemo(
    () => Array.from(new Set(logsEnriched.map(l => l.action))).sort(),
    [logsEnriched]
  );
  const actors = useMemo(
    () => Array.from(new Set(logsEnriched.map(l => l._actorName))).sort(),
    [logsEnriched]
  );
  const targetTypes = useMemo(
    () => Array.from(new Set(logsEnriched.map(l => l.targetType))).sort(),
    [logsEnriched]
  );

  const filteredSortedLogs = useMemo(() => {
    let data = [...logsEnriched];

    // Filters
    if (filterAction) data = data.filter(l => l.action === filterAction);
    if (filterActor) data = data.filter(l => l._actorName === filterActor);
    if (filterTargetType) data = data.filter(l => l.targetType === filterTargetType);

    // Search across actor/action/targetType/targetId
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(l =>
        (l._actorName || "").toLowerCase().includes(q) ||
        (l.action || "").toLowerCase().includes(q) ||
        (l.targetType || "").toLowerCase().includes(q) ||
        (l.targetId || "").toLowerCase().includes(q)
      );
    }

    // Sort
    data.sort((a, b) => {
      const av = getSortValue(a, sortField);
      const bv = getSortValue(b, sortField);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [logsEnriched, filterAction, filterActor, filterTargetType, search, sortField, sortDir]);

  function getSortValue(l, field) {
    switch (field) {
      case "actor": return (l._actorName || "").toLowerCase();
      case "action": return (l.action || "").toLowerCase();
      case "targetType": return (l.targetType || "").toLowerCase();
      case "targetId": return (l.targetId || "").toLowerCase();
      case "timestamp":
      default: return new Date(l.timestamp || 0).getTime();
    }
  }

  const toggleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    }
  };

  const sortIcon = (field) => {
    if (sortField !== field) return SORT_ICONS.none;
    return sortDir === "asc" ? SORT_ICONS.asc : SORT_ICONS.desc;
  };

  const clearFilters = () => {
    setFilterAction("");
    setFilterActor("");
    setFilterTargetType("");
    setSearch("");
    setSortField("timestamp");
    setSortDir("desc");
  };

  if (loading) return <div className="text-center p-8 text-gray-300">Loading...</div>;

  return (
    <div className="p-6 overflow-x-auto custom-scrollbar">
      <ErrorModal message={error} onClose={() => setError("")} />
      <h1 className="text-2xl font-bold mb-4 text-gray-200">Audit Logs</h1>

      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex flex-col">
          <label className="text-xs text-gray-400 mb-1">Search</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search text..."
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 focus:border-blue-500 outline-none w-56"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-400 mb-1">Action</label>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 focus:border-blue-500 outline-none"
          >
            <option value="">All</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-400 mb-1">Actor</label>
          <select
            value={filterActor}
            onChange={e => setFilterActor(e.target.value)}
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 focus:border-blue-500 outline-none"
          >
            <option value="">All</option>
            {actors.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-400 mb-1">Target Type</label>
          <select
            value={filterTargetType}
            onChange={e => setFilterTargetType(e.target.value)}
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 focus:border-blue-500 outline-none"
          >
            <option value="">All</option>
            {targetTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button
            onClick={clearFilters}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm"
        >
          Reset
        </button>
      </div>

      <div className="relative max-h-[550px] overflow-y-auto overflow-x-auto rounded-lg border border-gray-700 custom-scrollbar">
        <table className="min-w-full bg-gray-800 text-sm">
          <thead className="sticky top-0 z-10 bg-gray-700">
            <tr className="text-gray-200">
              <th className="p-2 text-left w-1/6">
                <button
                  onClick={() => toggleSort("timestamp")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Timestamp <span className="text-xs">{sortIcon("timestamp")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/5">
                <button
                  onClick={() => toggleSort("actor")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Actor <span className="text-xs">{sortIcon("actor")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/6">
                <button
                  onClick={() => toggleSort("action")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Action <span className="text-xs">{sortIcon("action")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/6">
                <button
                  onClick={() => toggleSort("targetType")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Target Type <span className="text-xs">{sortIcon("targetType")}</span>
                </button>
              </th>
              <th className="p-2 text-left w-1/3">
                <button
                  onClick={() => toggleSort("targetId")}
                  className="flex items-center gap-1 font-semibold"
                >
                  Target ID <span className="text-xs">{sortIcon("targetId")}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSortedLogs.map(l => (
              <tr key={l._id} className="border-b border-gray-700 text-gray-200">
                <td className="p-2 whitespace-nowrap">{formatDate(l.timestamp)}</td>
                <td className="p-2 whitespace-nowrap">{l._actorName}</td>
                <td className="p-2 whitespace-nowrap">{l.action}</td>
                <td className="p-2 whitespace-nowrap">{l.targetType}</td>
                <td className="p-2 whitespace-nowrap">{l.targetId}</td>
              </tr>
            ))}
            {filteredSortedLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  No logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}