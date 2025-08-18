// External Libraries
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Context
import { useAuth } from "./context/AuthContext";

// Layout Components
import Navbar from "./components/Navbar";
import AdminNavbar from "./components/AdminNavbar";
import Footer from "./components/Footer";
import NotificationDropdown from "./components/Notification";
import KeyVaultManager from "./components/KeyVaultManager";

// Routes
import PublicRoute from "./routes/PublicRoute";
import PrivateRoute from "./routes/PrivateRoute";

// Public Pages
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";

// User Pages
import UserLanding from "./pages/UserLanding";
import EncryptFile from "./pages/EncryptFile";
import DecryptFile from "./pages/DecryptFile";
import ManageFiles from "./pages/ManageFiles";
import ManageGroups from "./pages/ManageGroups";
import SettingsPage from "./pages/SettingsPage";

// Admin Pages
import AdminLanding from "./pages/AdminLanding";
import AdminManageUsers from "./pages/AdminManageUsers";
import AdminManageGroups from "./pages/AdminManageGroups";
import AdminManageFiles from "./pages/AdminManageFiles";
import AdminManageLogs from "./pages/AdminManageLogs";
import AdminSettingsPage from "./pages/AdminSettingsPage";


function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Landing />;
  if (user.role === "admin") return <AdminLanding />;
  return <UserLanding />;
}

export default function AppRoutes() {
  const { user } = useAuth();

  const NavbarComponent = user?.role === "admin" ? AdminNavbar : Navbar;

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-950">
        <NavbarComponent />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/signin" element={
              <PublicRoute>
                <SignIn />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            } />
            <Route path="/decrypt" element={<DecryptFile />} />

            <Route path="/encrypt" element={
              <PrivateRoute userOnly>
                <EncryptFile />
              </PrivateRoute>
            } />
            <Route path="/files" element={
              <PrivateRoute userOnly>
                <ManageFiles />
              </PrivateRoute>
            } />
            <Route path="/groups" element={
              <PrivateRoute userOnly>
                <ManageGroups />
              </PrivateRoute>
            } />
            <Route path="/notifications" element={
              <PrivateRoute userOnly>
                <NotificationDropdown />
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute userOnly>
                <SettingsPage />
              </PrivateRoute>
            } />
            <Route path="/keys" element={
              <PrivateRoute userOnly>
                <KeyVaultManager />
              </PrivateRoute>
            } />         
            <Route path="/manage-users" element={
              <PrivateRoute adminOnly>
                <AdminManageUsers />
              </PrivateRoute>
            } />
            <Route path="/manage-groups" element={
              <PrivateRoute adminOnly>
                 <AdminManageGroups />
              </PrivateRoute>
            } />
            <Route path="/manage-files" element={
              <PrivateRoute adminOnly>
                <AdminManageFiles />
              </PrivateRoute>
            } />
            <Route path="/manage-logs" element={
              <PrivateRoute adminOnly>
                <AdminManageLogs />
              </PrivateRoute>
            } />
            <Route path="/admin-settings" element={
              <PrivateRoute adminOnly>
                <AdminSettingsPage />
              </PrivateRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}