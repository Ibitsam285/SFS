import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import UserLanding from "./pages/UserLanding";
import { AuthProvider, useAuth } from "./context/AuthContext";

function DownloadFile() { return <div className="text-gray-100 pt-10 text-center">Download/Decrypt Page Coming Soon</div>; }
function EncryptFile() { return <div className="text-gray-100 pt-10 text-center">Encrypt File Page Coming Soon</div>; }
function SetAccess() { return <div className="text-gray-100 pt-10 text-center">Set Access Page Coming Soon</div>; }
function ShareFile() { return <div className="text-gray-100 pt-10 text-center">Share File Page Coming Soon</div>; }
function GroupSharing() { return <div className="text-gray-100 pt-10 text-center">Group Sharing Page Coming Soon</div>; }
function Notifications() { return <div className="text-gray-100 pt-10 text-center">Notifications Page Coming Soon</div>; }
function Settings() { return <div className="text-gray-100 pt-10 text-center">Settings Page Coming Soon</div>; }

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/signin" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-950">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/download" element={<DownloadFile />} />
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
              <Route path="/access" element={
                <PrivateRoute>
                  <SetAccess />
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
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;