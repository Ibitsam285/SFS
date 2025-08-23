import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "../utils/api";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const socket = io(import.meta.env.VITE_API_URL, { auth: { token: localStorage.getItem("token") } });

    socket.emit("join", user._id);
    socket.on("notification", notif => {
      setNotifications(prev => [notif, ...prev]);
      setUnread(count => count + 1);
    });

    return () => socket.disconnect();
  }, [user]);

  useEffect(() => {
    if (!user) { setNotifications([]); setUnread(0); return; }
    api.get("/notifications").then(res => {
      setNotifications(res.data);
      setUnread(res.data.filter(n => !n.read).length);
    });
  }, [user]);

  const markAsRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(notifs =>
      notifs.map(n => n._id === id ? { ...n, read: true } : n)
    );
    setUnread(notifs => Math.max(0, notifs - 1));
  };

  const markAllAsRead = async () => {
    await api.patch("/notifications/read-all");
    setNotifications(notifs => notifs.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  return (
    <NotificationsContext.Provider value={{
      notifications, unread, markAsRead, markAllAsRead
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}