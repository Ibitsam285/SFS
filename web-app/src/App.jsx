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

function ShareFile() { return <div className="text-gray-100 pt-10 text-center">Share File Page Coming Soon</div>; }
function GroupSharing() { return <div className="text-gray-100 pt-10 text-center">Group Sharing Page Coming Soon</div>; }
function Notifications() { return <div className="text-gray-100 pt-10 text-center">Notifications Page Coming Soon</div>; }
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
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-950">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
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
              <Route path="/share" element={
                <PrivateRoute>
                  <ShareFile />
                </PrivateRoute>
              } />
              <Route path="/groups" element={
                <PrivateRoute>
                  <GroupSharing />
                </PrivateRoute>
              } />
              <Route path="/notifications" element={
                <PrivateRoute>
                  <Notifications />
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
    </AuthProvider>
  );
}

export default App;