import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import Cookies from "js-cookie";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch {
        setUser(null);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  const signin = async (data) => {
    const res = await api.post("/auth/signIn", data);
    const me = await api.get("/users/me");
    setUser(me.data);
    return res.data;
  };

  const signup = async (data) => {
    const res = await api.post("/auth/signUp", data);
    return res.data;
  };

  const signout = async () => {
    await api.post("/auth/signOut");
    setUser(null);
    Cookies.remove("uid");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, signin, signup, signout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
