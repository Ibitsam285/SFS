import React, { useRef, useState } from "react";
import { getAllKeys, importKeys } from "../utils/KeyVault";

export default function KeyVaultManager() {
  const [exportStatus, setExportStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const fileInputRef = useRef();

  const handleExport = async () => {
    setExportStatus("");
    try {
      const keys = await getAllKeys();
      const dataStr = JSON.stringify(keys, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "keyvault-export.json";
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus("Key vault exported successfully!");
    } catch (err) {
      setExportStatus("Failed to export key vault.");
    }
  };

  const handleImport = async (e) => {
    setImportStatus("");
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        await importKeys(json);
        setImportStatus("Key vault imported successfully!");
      } catch (err) {
        setImportStatus("Failed to import key vault. Invalid file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 rounded-lg shadow p-6 my-8">
      <h2 className="text-xl font-bold text-blue-400 mb-4 text-center">Key Vault</h2>
      <div className="mb-4 flex flex-col items-center gap-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
          onClick={handleExport}
        >
          Export Key Vault
        </button>
        {exportStatus && <div className="text-green-400 text-sm">{exportStatus}</div>}
      </div>
      <hr className="my-4 border-gray-700"/>
      <div className="mb-4 flex flex-col items-center gap-2">
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          Import Key Vault
        </button>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImport}
        />
        {importStatus && <div className="text-green-400 text-sm">{importStatus}</div>}
      </div>
      <div className="mt-4 text-xs text-gray-400 text-center">
        Export your saved file keys and IVs as a backup, or import them to restore on this or another device.
      </div>
    </div>
  );
}