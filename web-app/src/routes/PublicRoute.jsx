import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) {
    // Already logged in, redirect to dashboard or desired route
    return <Navigate to="/user" replace />;
  }
  // Not logged in, allow access
  return children;
}