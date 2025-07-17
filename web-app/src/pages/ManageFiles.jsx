import { useState, useEffect } from "react";
import api from "../utils/api";
import ManageAccess from "../components/ManageAccess";
import { TrashIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

function ManageFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessFile, setAccessFile] = useState(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/files");
      setFiles(res.data);
    } catch {
      setFiles([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      await api.delete(`/files/${fileId}`);
      setFiles(f => f.filter(file => file._id !== fileId));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete file.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">Manage Files</h2>
      {loading ? (
        <div className="text-gray-300 text-center">Loading files...</div>
      ) : files.length === 0 ? (
        <div className="text-gray-400 text-center">No files found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-900 text-gray-200 rounded-lg shadow">
            <thead>
              <tr>
                <th className="p-3">File Name</th>
                <th className="p-3">Size</th>
                <th className="p-3">Uploaded</th>
                <th className="p-3">Access</th>
                <th className="p-3">Delete</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file._id} className="border-t border-gray-700">
                  <td className="p-3 pl-10">{file.filename}</td>
                  <td className="p-3 pl-10">{file.metadata?.size} bytes</td>
                  <td className="p-3 pl-10">{file.metadata?.uploadDate ? new Date(file.metadata.uploadDate).toLocaleString() : "—"}</td>
                  <td className="p-3 pl-10">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded p-2"
                      onClick={() => setAccessFile(file)}
                      title="Manage Access"
                    >
                      <Cog6ToothIcon className="w-5 h-5" />
                    </button>
                  </td>
                  <td className="p-3 pl-10">
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white rounded p-2"
                      onClick={() => handleDelete(file._id)}
                      title="Delete File"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {accessFile && (
        <ManageAccess
          file={accessFile}
          onClose={() => { setAccessFile(null); fetchFiles(); }}
        />
      )}
    </div>
  );
}

export default ManageFiles;