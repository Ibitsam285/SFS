import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-blue-400 tracking-tight">Secure File Sharing</span>
        </div>
        <div className="flex gap-4">
          <Link
            to="/signin"
            className={`text-gray-300 hover:text-blue-400 transition ${location.pathname === "/signin" ? "font-semibold text-blue-400" : ""}`}
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className={`text-gray-300 hover:text-blue-400 transition ${location.pathname === "/signup" ? "font-semibold text-blue-400" : ""}`}
          >
            Sign up
          </Link>
          <Link
            to="/download"
            className={`text-gray-300 hover:text-blue-400 transition ${location.pathname === "/download" ? "font-semibold text-blue-400" : ""}`}
          >
            Download/Decrypt File
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;