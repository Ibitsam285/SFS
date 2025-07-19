import { useEffect, useRef, useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import api from "../utils/api";

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const dropdownRef = useRef();

  // Fetch notifications on open
  useEffect(() => {
    if (open) {
      setLoading(true);
      api.get("/notifications")
        .then(res => {
          setNotifications(res.data);
          setUnread(res.data.filter(n => !n.read).length);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  // Mark one notification as read
  const handleMarkRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(notifications =>
      notifications.map(n => n._id === id ? { ...n, read: true } : n)
    );
    setUnread(n => Math.max(0, n - 1));
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    await api.patch("/notifications/read-all");
    setNotifications(notifications => notifications.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell icon with badge */}
      <button
        className="relative p-2 hover:bg-gray-800 rounded"
        onClick={() => setOpen(open => !open)}
        aria-label="Notifications"
      >
        <BellIcon className="w-7 h-7 text-gray-200" />
        {unread > 0 && (
          <span className="absolute right-0 top-0 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">{unread}</span>
        )}
      </button>
      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[95vw] bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4 flex justify-between items-center border-b border-gray-700">
            <span className="font-bold text-blue-400">Notifications</span>
            {unread > 0 && (
              <button
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-800">
            {loading ? (
              <div className="p-4 text-gray-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-gray-400">No notifications.</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  className={`flex items-start gap-2 p-4 transition bg-opacity-80 ${n.read ? "bg-gray-900" : "bg-blue-950"}`}
                >
                  <div className="flex-1">
                    <div className={`text-gray-200 ${!n.read ? "font-bold" : ""}`}>{n.content}</div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(n.timestamp).toLocaleString()}</div>
                  </div>
                  {!n.read && (
                    <button
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded self-start"
                      onClick={() => handleMarkRead(n._id)}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}