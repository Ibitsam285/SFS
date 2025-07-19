import { AuthProvider, useAuth } from "./context/AuthContext";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import UserLanding from "./pages/UserLanding";
import EncryptFile from "./pages/EncryptFile";
import DecryptFile from "./pages/DecryptFile";
import ManageFiles from "./pages/ManageFiles"
import KeyVaultManager from "./components/KeyVaultManager";
import ManageGroups from "./pages/ManageGroups";
import NotificationDropdown from "./components/Notification";
import { NotificationsProvider } from "./context/NotificationsContext";
import PublicRoute from "./routes/PublicRoute";

function Settings() { return <div className="text-gray-100 pt-10 text-center">Settings Page Coming Soon</div>; }

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/signin" />;
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <UserLanding /> : <Landing />;
}

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-gray-950">
            <Navbar />
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
                <Route path="/user" element={
                  <PrivateRoute>
                    <UserLanding />
                  </PrivateRoute>
                } />
                <Route path="/encrypt" element={
                  <PrivateRoute>
                    <EncryptFile />
                  </PrivateRoute>
                } />
                <Route path="/files" element={
                  <PrivateRoute>
                    <ManageFiles />
                  </PrivateRoute>
                } />
                <Route path="/groups" element={
                  <PrivateRoute>
                    <ManageGroups />
                  </PrivateRoute>
                } />
                <Route path="/notifications" element={
                  <PrivateRoute>
                    <NotificationDropdown />
                  </PrivateRoute>
                } />
                <Route path="/settings" element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                } />
                <Route path="/keys" element={
                  <PrivateRoute>
                    <KeyVaultManager />
                  </PrivateRoute>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;