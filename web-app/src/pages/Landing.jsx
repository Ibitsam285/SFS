import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="bg-gray-950 min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <h1 className="text-4xl md:text-5xl font-bold text-blue-400 mb-6 text-center">
        Welcome to Secure File Sharing
      </h1>
      <p className="text-gray-300 mb-8 text-lg max-w-2xl text-center">
        Share and manage your files securely with advanced access controls, encrypted storage, groups, audit logging, and real-time notifications. <br />
        <span className="text-blue-400 font-semibold">Your privacy, our priority.</span>
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link to="/signup" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-semibold shadow transition">
          Get Started
        </Link>
        <Link to="/signin" className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-6 py-2 rounded-md font-semibold shadow transition">
          Sign In
        </Link>
        <Link to="/download" className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-6 py-2 rounded-md font-semibold shadow transition">
          Download/Decrypt File
        </Link>
      </div>
      <section className="mt-12 max-w-3xl w-full bg-gray-900 bg-opacity-60 rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-100 mb-4">Features</h2>
        <ul className="space-y-2 text-gray-400">
          <li>🔒 End-to-end encrypted file sharing</li>
          <li>🕵️‍♂️ Audit logs for every action</li>
          <li>📢 Real-time notifications</li>
          <li>👥 Share with individuals or groups</li>
          <li>🛡️ Fine-grained access controls</li>
        </ul>
      </section>
    </div>
  );
}

export default Landing;