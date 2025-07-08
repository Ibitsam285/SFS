import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { BellIcon, Cog6ToothIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const menuOptions = {
  guest: [
    { label: "Sign in", to: "/signin" },
    { label: "Sign up", to: "/signup" },
    { label: "Download/Decrypt File", to: "/download" },
  ],
  user: [
    { label: "Encrypt File", to: "/encrypt" },
    { label: "Set Access", to: "/access" },
    { label: "Download/Decrypt File", to: "/download" },
    { label: "Share File", to: "/share" },
    { label: "Group Sharing", to: "/groups" },
  ],
};

function Navbar({ options }) {
  const { user, signout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = options || (user ? menuOptions.user : menuOptions.guest);

  return (
    <nav className="bg-gray-900 border-b border-gray-800 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold text-blue-400 tracking-tight">Secure File Sharing</Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {links.map((opt) => (
            <Link
              key={opt.to}
              to={opt.to}
              className={`text-gray-300 hover:text-blue-400 transition ${
                location.pathname === opt.to ? "font-semibold text-blue-400" : ""
              }`}
            >
              {opt.label}
            </Link>
          ))}
          {user && (
            <>
              <Link to="/notifications" className="relative text-gray-300 hover:text-blue-400 transition">
                <BellIcon className="w-6 h-6" />
              </Link>
              <Link to="/settings" className="ml-2 text-gray-300 hover:text-blue-400 transition">
                <Cog6ToothIcon className="w-6 h-6" />
              </Link>
              <button
                onClick={signout}
                className="ml-4 bg-gray-800 hover:bg-red-600 text-gray-100 px-3 py-1 rounded transition"
              >
                Log Out
              </button>
            </>
          )}
        </div>

        <button
          className="md:hidden text-gray-300 hover:text-blue-400"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <XMarkIcon className="w-7 h-7" /> : <Bars3Icon className="w-7 h-7" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 pb-4">
          <div className="flex flex-col gap-3">
            {links.map((opt) => (
              <Link
                key={opt.to}
                to={opt.to}
                onClick={() => setMobileOpen(false)}
                className={`text-gray-300 hover:text-blue-400 transition py-1 border-b border-gray-800 last:border-b-0 ${
                  location.pathname === opt.to ? "font-semibold text-blue-400" : ""
                }`}
              >
                {opt.label}
              </Link>
            ))}
            {user && (
              <>
                <Link to="/notifications" className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition py-1">
                  <BellIcon className="w-6 h-6" /> Notifications
                </Link>
                <Link to="/settings" className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition py-1">
                  <Cog6ToothIcon className="w-6 h-6" /> Settings
                </Link>
                <button
                  onClick={() => { signout(); setMobileOpen(false); }}
                  className="bg-gray-800 hover:bg-red-600 text-gray-100 px-3 py-2 rounded transition mt-2"
                >
                  Log Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;