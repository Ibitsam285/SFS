import { useEffect, useState } from "react";
import api from "../utils/api";
import UserProfileSection from "../components/UserProfileSection";
import PasswordChangeSection from "../components/PasswordChangeSection";
import FilesStatsSection from "../components/FilesStatsSection";
import UserLogsSection from "../components/UserLogsSection";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const userRes = await api.get("/users/me");
      setUser(userRes.data);
      const filesRes = await api.get("/files");
      setFiles(filesRes.data);
      const logsRes = await api.get(`/users/${userRes.data._id}/logs`);
      setLogs(logsRes.data);
      setLoading(false);
    }
    fetchAll();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  // Files stats
  const ownedCount = files.filter(f => f.ownerId === user._id).length;
  const accessibleCount = files.filter(f =>
    f.ownerId === user._id ||
    (f.recipients && f.recipients.includes(user._id)) ||
    (f.recipientGroups && user.groups.some(gid => f.recipientGroups.includes(gid)))
  ).length;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-blue-300 mb-6">Settings</h1>
      <UserProfileSection user={user} setUser={setUser}/>
      <PasswordChangeSection user={user} setUser={setUser}/>
      <FilesStatsSection owned={ownedCount} accessible={accessibleCount}/>
      <UserLogsSection logs={logs}/>
    </div>
  );
}