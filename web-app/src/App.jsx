import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";

function SignIn() { return <div className="text-gray-100 pt-10 text-center">Sign In Page Coming Soon</div>; }
function SignUp() { return <div className="text-gray-100 pt-10 text-center">Sign Up Page Coming Soon</div>; }
function DownloadFile() { return <div className="text-gray-100 pt-10 text-center">Download/Decrypt Page Coming Soon</div>; }

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-950">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/download" element={<DownloadFile />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;