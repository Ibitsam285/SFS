import { Link, useLocation } from "react-router-dom";
import {
  Cog6ToothIcon,
  UsersIcon,
  UserGroupIcon,
  FolderIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const adminLinks = [
  { label: "Manage Users", to: "/manage-users", icon: <UsersIcon className="w-5 h-5" /> },
  { label: "Manage Groups", to: "/manage-groups", icon: <UserGroupIcon className="w-5 h-5" /> },
  { label: "Manage Files", to: "/manage-files", icon: <FolderIcon className="w-5 h-5" /> },
  { label: "Manage Logs", to: "/manage-logs", icon: <DocumentTextIcon className="w-5 h-5" /> },
  { label: "Settings", to: "/admin-settings", icon: <Cog6ToothIcon className="w-5 h-5" /> },
];

export default function AdminNavbar() {
  const { user, signout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-gray-900 border-b border-gray-800 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-blue-400 tracking-tight">Admin Panel</Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          {adminLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1 text-gray-300 hover:text-blue-400 transition ${
                location.pathname === link.to ? "font-semibold text-blue-400" : ""
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <button
            onClick={signout}
            className="ml-4 bg-gray-800 hover:bg-red-600 text-gray-100 px-3 py-1 rounded transition"
          >
            Log Out
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-gray-300 hover:text-blue-400"
          onClick={() => setMobileOpen(open => !open)}
        >
          {mobileOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 pb-4 animate-fade-in">
          <div className="flex flex-col gap-3">
            {adminLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 text-gray-300 hover:text-blue-400 transition py-2 px-2 rounded ${
                  location.pathname === link.to ? "font-semibold text-blue-400 bg-gray-800" : ""
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => { signout(); setMobileOpen(false); }}
              className="bg-gray-800 hover:bg-red-600 text-white px-3 py-2 rounded transition mt-2"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
