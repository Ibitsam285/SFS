const VAULT_PREFIX = "filekey_";

async function deriveVaultKey(passphrase) {
  const enc = new TextEncoder();
  const salt = enc.encode("file-key-salt"); 
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function randomIV() {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function b64ToBuf(b64) {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

export async function storeFileKey(fileId, { key, iv }, passphrase) {
  const vaultKey = await deriveVaultKey(passphrase);
  const bundle = JSON.stringify({ key, iv });
  const enc = new TextEncoder();
  const data = enc.encode(bundle);
  const storageIV = randomIV();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: storageIV },
    vaultKey,
    data
  );
  const record = {
    iv: bufToB64(storageIV),
    data: bufToB64(encrypted)
  };
  localStorage.setItem(VAULT_PREFIX + fileId, JSON.stringify(record));
}

export async function loadFileKey(fileId, passphrase) {
  const recordStr = localStorage.getItem(VAULT_PREFIX + fileId);
  if (!recordStr) return null;
  const { iv, data } = JSON.parse(recordStr);
  const vaultKey = await deriveVaultKey(passphrase);
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBuf(iv) },
      vaultKey,
      b64ToBuf(data)
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
  } catch {
    return null; 
  }
}

export function removeFileKey(fileId) {
  localStorage.removeItem(VAULT_PREFIX + fileId);
}

export function listVaultedFileIds() {
  return Object.keys(localStorage)
    .filter(k => k.startsWith(VAULT_PREFIX))
    .map(k => k.slice(VAULT_PREFIX.length));
}

export function getAllKeys() {
  const result = {};
  for (const key in localStorage) {
    if (key.startsWith(VAULT_PREFIX)) {
      const fileId = key.slice(VAULT_PREFIX.length);
      try {
        result[fileId] = JSON.parse(localStorage.getItem(key));
      } catch {
        // Ignore invalid entries
      }
    }
  }
  return result;
}

/**
 * Import keys from an object (as exported by getAllKeys).
 * Overwrites any existing keys with the same fileId.
 * @param {object} obj - { [fileId]: { iv, data } }
 */
export function importKeys(obj) {
  if (typeof obj !== "object" || obj === null) return;
  for (const fileId in obj) {
    const record = obj[fileId];
    if (record && typeof record.iv === "string" && typeof record.data === "string") {
      localStorage.setItem(VAULT_PREFIX + fileId, JSON.stringify(record));
    }
  }
}