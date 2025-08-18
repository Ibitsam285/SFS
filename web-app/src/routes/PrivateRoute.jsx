export default function PrivateRoute({ children, adminOnly, userOnly }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/signin" />;
  if (adminOnly && user.role !== "admin") return <NotFound />;
  if (userOnly && user.role === "admin") return <NotFound />;
  return children;
}