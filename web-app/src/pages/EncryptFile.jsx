import { useState } from "react";
import api from "../utils/api";
import { storeFileKey } from "../utils/KeyVault";

async function generateKeyAndIV() {
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); 
  return { key, iv };
}

async function exportKey(key) {
  const raw = await window.crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

async function encryptData(buffer, key, iv) {
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    buffer
  );
  return new Uint8Array(encrypted);
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

function EncryptFile() {
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState("");
  const [status, setStatus] = useState("");
  const [downloadKey, setDownloadKey] = useState("");
  const [showSaveKey, setShowSaveKey] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [fileId, setFileId] = useState("");
  const [encryptedData, setEncryptedData] = useState(null); 

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setFilename(f ? f.name : "");
    setStatus("");
    setDownloadKey("");
    setShowSaveKey(false);
    setPassphrase("");
    setFileId("");
    setEncryptedData(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setStatus("Encrypting file...");
    const buffer = await file.arrayBuffer();

    const { key, iv } = await generateKeyAndIV();

    const encrypted = await encryptData(buffer, key, iv);
    setEncryptedData(encrypted); // store for download

    const exportedKey = await exportKey(key);
    const ivB64 = arrayBufferToBase64(iv);

    const encryptedDataB64 = arrayBufferToBase64(encrypted);

    const metadata = {
      size: file.size,
      type: file.type,
      uploadDate: new Date(),
    };

    setStatus("Uploading encrypted file...");
    try {
      const resp = await api.post("/files", {
        filename: filename,
        encryptedData: encryptedDataB64,
        metadata,
      });
      setFileId(resp.data._id); 
      setStatus("Upload successful!");
      setDownloadKey(`Key: ${exportedKey}\nIV: ${ivB64}`);
      setShowSaveKey(true);
    } catch (err) {
      setStatus("Upload failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handleSaveKey = async () => {
    if (!passphrase) return;
    const [keyLine, ivLine] = downloadKey.split("\n");
    const key = keyLine.split("Key: ")[1];
    const iv = ivLine.split("IV: ")[1];
    await storeFileKey(fileId, { key, iv }, passphrase);
    setStatus("Key saved in browser!");
    setShowSaveKey(false);
  };

  const handleDownloadEncrypted = () => {
    if (!encryptedData || !filename) return;
    const blob = new Blob([encryptedData], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename + ".encrypted";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-lg mx-auto py-10">
      <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">Encrypt & Upload File</h2>
      <form
        className="bg-gray-900 rounded-lg shadow p-8 flex flex-col gap-4"
        onSubmit={handleUpload}
      >
        <input
          type="file"
          className="text-gray-200 bg-gray-800 rounded p-2"
          onChange={handleFileChange}
        />
        <button
          type="submit"
          disabled={!file}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-semibold transition disabled:opacity-60"
        >
          Encrypt & Upload
        </button>
        {status && <div className="text-gray-300 text-center">{status}</div>}
        {downloadKey && (
          <div className="bg-gray-800 text-blue-300 p-3 mt-4 rounded text-sm break-all">
            <strong>Keep this key and IV to decrypt your file later!</strong>
            <pre className="whitespace-pre-wrap">{downloadKey}</pre>
            <button
              type="button"
              className="bg-green-700 hover:bg-green-800 text-white rounded py-1 px-3 mt-3"
              onClick={handleDownloadEncrypted}
              disabled={!encryptedData}
            >
              Download Encrypted File
            </button>
          </div>
        )}
        {showSaveKey && (
          <div className="bg-gray-800 p-3 mt-4 rounded text-gray-200 flex flex-col gap-2">
            <label>Save key in browser (encrypted with a passphrase):</label>
            <input
              type="password"
              className="bg-gray-700 rounded p-2"
              placeholder="Enter a passphrase"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
            />
            <button
              type="button"
              disabled={!passphrase}
              onClick={handleSaveKey}
              className="bg-green-600 hover:bg-green-700 text-white rounded py-1"
            >
              Save Key Securely
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default EncryptFile;