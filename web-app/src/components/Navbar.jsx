import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext"; // <-- import this!
import { useState, useRef, useEffect } from "react";
import { BellIcon, Cog6ToothIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const menuOptions = {
  guest: [
    { label: "Sign up", to: "/signup" },
    { label: "Sign in", to: "/signin" },
    { label: "Download/Decrypt File", to: "/decrypt" },
  ],
  user: [
    { label: "Manage Files", to: "/files" },
    { label: "Encrypt File", to: "/encrypt" },
    { label: "Download/Decrypt File", to: "/decrypt" },
    { label: "Manage Groups", to: "/groups" },
    { label: "Import/Export Keys", to: "/keys" },
  ],
};

function Navbar({ options }) {
  const { user, signout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { unread, notifications, markAsRead, markAllAsRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

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
              {/* Notification Bell */}
              <div className="relative" ref={dropdownRef}>
                <button
                  className="relative text-gray-300 hover:text-blue-400 transition mt-2"
                  onClick={() => setShowDropdown(v => !v)}
                  aria-label="Notifications"
                >
                  <BellIcon className="w-6 h-6" />
                  {unread > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-xs text-white rounded-full px-2">
                      {unread}
                    </span>
                  )}
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-50">
                    <div className="p-3 flex justify-between items-center border-b border-gray-800">
                      <span className="font-semibold text-blue-400">Notifications</span>
                      <button
                        className="text-xs text-gray-300 hover:text-blue-400"
                        onClick={markAllAsRead}
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="text-gray-400 p-4 text-center">No notifications.</div>
                      ) : (
                        notifications.slice(0, 15).map(n => (
                          <div
                            key={n._id}
                            className={`p-3 border-b text-white border-gray-800 cursor-pointer hover:bg-gray-800 flex justify-between items-center ${n.read ? "opacity-60" : ""}`}
                            onClick={() => {
                              if (!n.read) markAsRead(n._id);
                              setShowDropdown(false);
                            }}
                          >
                            <span>{n.content}</span>
                            {!n.read && <span className="rounded-full w-2 h-2 bg-blue-400 ml-2 inline-block" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                <button
                  className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition py-1 relative"
                  onClick={() => setShowDropdown(v => !v)}
                >
                  <BellIcon className="w-6 h-6" />
                  Notifications
                  {unread > 0 && (
                    <span className="absolute -top-2 left-6 bg-red-600 text-xs text-white rounded-full px-2">
                      {unread}
                    </span>
                  )}
                </button>
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