import { useState } from "react";
import api from "../utils/api";

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importKey(base64Key) {
  const raw = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    "raw",
    raw,
    "AES-GCM",
    false,
    ["decrypt"]
  );
}

async function decryptData(encryptedBase64, base64Key, base64IV) {
  const key = await importKey(base64Key);
  const iv = new Uint8Array(base64ToArrayBuffer(base64IV));
  const encrypted = base64ToArrayBuffer(encryptedBase64);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );
  return new Uint8Array(decrypted);
}

function DownloadFile() {
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [key, setKey] = useState("");
  const [iv, setIV] = useState("");
  const [status, setStatus] = useState("");
  const [fileMeta, setFileMeta] = useState(null);
  const [passphrase, setPassphrase] = useState("");
  const [needsPassphrase, setNeedsPassphrase] = useState(false);

  useEffect(() => {
    api.get("/files")
      .then(res => setFiles(res.data))
      .catch(() => setFiles([]));
  }, []);

  useEffect(() => {
    if (!selectedFileId) {
      setKey(""); setIV(""); setNeedsPassphrase(false);
      return;
    }
    setNeedsPassphrase(true);
    setKey(""); setIV("");
  }, [selectedFileId]);

  const handleLoadKey = async () => {
    if (!selectedFileId || !passphrase) return;
    setStatus("Loading key from browser...");
    const bundle = await loadFileKey(selectedFileId, passphrase);
    if (bundle && bundle.key && bundle.iv) {
      setKey(bundle.key);
      setIV(bundle.iv);
      setStatus("Key loaded!");
      setNeedsPassphrase(false);
    } else {
      setStatus("Failed to load key: wrong passphrase or not saved.");
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    setStatus("");
    setFileMeta(null);

    if (!selectedFileId || !key || !iv) {
      setStatus("File, Key, and IV are required.");
      return;
    }

    setStatus("Fetching encrypted file...");
    let res;
    try {
      res = await api.get(`/files/${selectedFileId}`);
    } catch (err) {
      setStatus("File fetch failed: " + (err.response?.data?.error || err.message));
      return;
    }

    setStatus("Decrypting...");
    try {
      const decrypted = await decryptData(res.data.encryptedData, key, iv);
      const blob = new Blob([decrypted], { type: res.data.metadata.type || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      setStatus("Download successful!");
      setFileMeta({
        filename: res.data.filename,
        size: res.data.metadata.size,
        type: res.data.metadata.type,
      });
    } catch (err) {
      setStatus("Decryption failed: " + err.message);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-10">
      <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">Download & Decrypt File</h2>
      <form
        className="bg-gray-900 rounded-lg shadow p-8 flex flex-col gap-4"
        onSubmit={handleDownload}
      >
        <label className="text-gray-300">Your Files</label>
        <select
          value={selectedFileId}
          onChange={e => setSelectedFileId(e.target.value)}
          className="bg-gray-800 text-gray-200 rounded p-2"
        >
          <option value="">Select file...</option>
          {files.map(f => (
            <option value={f._id} key={f._id}>{f.filename} ({f.metadata?.size} bytes)</option>
          ))}
        </select>

        {needsPassphrase && (
          <div className="flex flex-col gap-2">
            <label className="text-gray-300">Load Key from Browser (enter vault passphrase):</label>
            <input
              type="password"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
              className="bg-gray-700 text-gray-200 rounded p-2"
              placeholder="Vault passphrase"
            />
            <button
              type="button"
              className="bg-green-600 hover:bg-green-700 text-white rounded py-1"
              disabled={!passphrase}
              onClick={handleLoadKey}
            >
              Load Key
            </button>
          </div>
        )}

        <label className="text-gray-300">Key (Base64)</label>
        <input
          type="text"
          value={key}
          onChange={e => setKey(e.target.value)}
          className="text-gray-200 bg-gray-800 rounded p-2"
          placeholder="Paste Key"
        />
        <label className="text-gray-300">IV (Base64)</label>
        <input
          type="text"
          value={iv}
          onChange={e => setIV(e.target.value)}
          className="text-gray-200 bg-gray-800 rounded p-2"
          placeholder="Paste IV"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-semibold transition disabled:opacity-60"
        >
          Download & Decrypt
        </button>
        {status && <div className="text-gray-300 text-center">{status}</div>}
        {fileMeta && (
          <div className="bg-gray-800 text-blue-300 p-3 mt-4 rounded text-sm break-all">
            <div>File: <b>{fileMeta.filename}</b></div>
            <div>Type: {fileMeta.type}</div>
            <div>Size: {fileMeta.size} bytes</div>
          </div>
        )}
      </form>
      <div className="mt-6 text-gray-400 text-xs">
        <p>You can load your key from browser vault (if saved), or paste manually.</p>
      </div>
    </div>
  );
}

export default DownloadFile;