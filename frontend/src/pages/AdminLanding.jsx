import { Link } from "react-router-dom";
import { UsersIcon, FolderIcon, DocumentTextIcon, Cog6ToothIcon, UserGroupIcon } from "@heroicons/react/24/outline";

export default function AdminLanding() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <h1 className="text-3xl md:text-4xl font-bold text-blue-400 mb-6">Welcome, Admin</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">
        <AdminCard to="/manage-users" icon={<UsersIcon className="w-8 h-8" />} label="Manage Users" />
        <AdminCard to="/manage-groups" icon={<UserGroupIcon className="w-8 h-8" />} label="Manage Groups" />
        <AdminCard to="/manage-files" icon={<FolderIcon className="w-8 h-8" />} label="Manage Files" />
        <AdminCard to="/manage-logs" icon={<DocumentTextIcon className="w-8 h-8" />} label="Manage Logs" />
      </div>
    </div>
  );
}

function AdminCard({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 bg-gray-800 hover:bg-blue-900 transition rounded-lg px-5 py-4 shadow-lg"
    >
      {icon}
      <span className="text-lg font-semibold text-white">{label}</span>
    </Link>
  );
}