import { useState } from "react";
import api from "../utils/api";

export default function UserLogsSection({ logs }) {
  const [show, setShow] = useState(false);

  return (
    <section className="bg-gray-800 p-4 rounded">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg text-blue-200">Your Logs</h2>
        <button className="text-blue-400" onClick={() => setShow(s => !s)}>
          {show ? "Hide" : "Show"} Logs
        </button>
      </div>
      {show && (
        <div className="mt-2 max-h-56 overflow-y-auto text-sm custom-scrollbar">
          {logs.length === 0 ? (
            <div className="text-gray-400">No logs yet.</div>
          ) : logs.map(log => (
            <div key={log._id} className="border-b border-gray-700 py-1">
              <span className="text-gray-300">{new Date(log.timestamp).toLocaleString()}</span>
              <span className="ml-2 text-blue-300">{log.action}</span>
              <span className="ml-2 text-gray-400">
                {log.targetType}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}