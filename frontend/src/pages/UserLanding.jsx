import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../utils/api";

function UserLanding() {
  const { user } = useAuth();
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    api.get("/notifications")
        .then(res => {
          if(res.data && Array.isArray(res.data)) {
            const topThree = res.data.slice(0, 3);
            const extractedActivity = topThree.map(item => ({
              action: item.type,
              detail: item.content
            }));
            setActivity(extractedActivity);
          }
        })
        .catch(err => console.error(err));
  }, []);

  if (!user) return null;
  const display = user.username || user.email || "User";

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">
          Welcome, {display}
        </h1>
        <p className="text-gray-300 mb-6">
          This is your dashboard. Use the quick links below to manage your files, groups, and review your recent activity. Stay updated with your notifications!
        </p>
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Link to="/files" className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow p-5 flex flex-col items-center transition">
            <span className="material-icons text-xl mb-2">File Management</span>
            <span className="text-xs text-blue-100 mt-1">Upload, view, or manage your files</span>
          </Link>
          <Link to="/groups" className="bg-green-700 hover:bg-green-800 text-white rounded-lg shadow p-5 flex flex-col items-center transition">
            <span className="material-icons text-xl mb-2">Group Management</span>
            <span className="text-xs text-green-100 mt-1">View or join groups</span>
          </Link>
          <Link to="/settings" className="bg-gray-700 hover:bg-gray-800 text-white rounded-lg shadow p-5 flex flex-col items-center transition">
            <span className="material-icons text-xl mb-2">Settings</span>
            <span className="text-xs text-gray-300 mt-1">Account & preferences</span>
          </Link>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-blue-300 mb-2">Recent Activity</h2>
          <div className="bg-gray-800 rounded-lg p-4">
            {activity.length === 0 ? (
              <span className="text-gray-400">No recent activity.</span>
            ) : (
              <ul className="divide-y divide-gray-700">
                {activity.map((log) => (
                  <li key={log.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-100">{log.action}</span>
                      <span className="ml-2 text-gray-400">{log.detail}</span>
                    </div>
                    <span className="text-xs text-gray-500">{log.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserLanding;