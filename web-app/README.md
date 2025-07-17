# Secure File Storage (SFS) Web App

A privacy-focused, end-to-end encrypted file storage and sharing web application.

---

## Features

- **End-to-end encryption**: All files are encrypted client-side before upload.
- **User authentication**: Only registered users can upload/encrypt files.
- **File sharing**: Share files with other users or groups; manage access and permissions.
- **Access controls**: Set max downloads, expiry, or revoke access.
- **Key vault**: Securely store, export, and import your file encryption keys in the browser.
- **Guest decryption**: Anyone (even unauthenticated users) can decrypt files, given the encrypted file and its key+IV.

---

## Architecture

### Encryption Model

- **AES-GCM** with a random 256-bit key and 96-bit IV per file.
- **Encryption happens in-browser**; the server never sees plaintext or keys.
- **Key and IV are shown after each encryption and can be saved.**

### File Storage & Access

- **Files:** Encrypted binary blobs are stored on the server, bound to user accounts and access control metadata.
- **Keys/IVs:** Only stored in the browser (localStorage), optionally exported/imported by the user.

---

## How Encryption & Key Management Works

### 1. Encrypting a File

- User selects a file to upload.
- The browser:
  - Generates a random AES-256 key and IV.
  - Encrypts the file with AES-GCM.
  - Uploads the encrypted data to the backend.
  - Displays the key/IV to the user for safekeeping.
- User can optionally:
  - Save the key/IV in the browser vault, encrypted with a passphrase.
  - Download the encrypted file (in addition to uploading).

### 2. Key Vault Storage

- Each file's key/IV is stored in `localStorage` under the key:  
  `filekey_<fileId>`
- The record is encrypted using a vault key derived from the user's passphrase using PBKDF2.
- Example record structure:
  ```json
  {
    "iv": "<base64 storage IV>",
    "data": "<base64 encrypted {key,iv} bundle>"
  }
  ```

### 3. Export/Import Vault

- **Export:** Downloads all stored keys/IVs as a JSON file.  
  Useful for backup or migration to another device.
- **Import:** Loads a previously exported vault JSON, merging its keys into the browser's storage.

### 4. Decrypting Files

- **Logged in:** User can select from their files, auto-load key/IV from vault, or paste key/IV.
- **Guest:** Upload any encrypted file, provide key/IV, and decrypt locally (no authentication needed).

---

## Frontend Overview

- **`src/pages/EncryptFile.jsx`**  
  - Only accessible to logged-in users.
  - Encrypts and uploads a file, shows key/IV, allows download of encrypted file and saving key to vault.

- **`src/pages/DecryptFile.jsx`**  
  - Logged-in users can select their files or upload any encrypted file for decryption.
  - Guest users can only upload an encrypted file and provide key/IV.

- **`src/components/ManageAccess.jsx`**  
  - Manage file sharing (users/groups), access controls, and revoke access.

- **`src/components/KeyVaultManager.jsx`**  
  - Export/import all saved keys from/to the browser vault.

- **`src/utils/KeyVault.js`**  
  - Handles key storage, retrieval, export, and import.
  - Uses PBKDF2 to derive a vault key from a passphrase for encrypting individual file keys/IVs.

---

## Key Vault: Export/Import

- **Export:**  
  - Reads all `filekey_<fileId>` entries from localStorage.
  - Creates a JSON map: `{ fileId: { iv, data }, ... }`
  - Download as `keyvault-export.json`.

- **Import:**  
  - Reads a JSON file with the above structure.
  - Writes each entry back to localStorage.

- **Security:**  
  - Keys/IVs in vault are encrypted with a passphrase-derived AES key.
  - If passphrase is forgotten, the keys in the vault cannot be recovered.

---

## Guest vs. Registered Users

| Feature                       | Guest        | Registered User      |
|-------------------------------|--------------|---------------------|
| Encrypt & upload file         | ❌           | ✅                  |
| Download encrypted file       | ❌           | ✅ (after encrypt)  |
| Decrypt file (upload+key/iv)  | ✅           | ✅                  |
| Decrypt own uploaded files    | ❌           | ✅                  |
| Key vault (save/load/export)  | ❌           | ✅                  |
| Share files                   | ❌           | ✅                  |

---

## Security Model

- **Zero knowledge:**  
  The server never sees plaintext files or their encryption keys.
- **Key management:**  
  Keys are only stored in the browser, encrypted with a user-controlled passphrase, and optionally exported/imported by the user.
- **Sharing:**  
  You must securely transmit the key/IV to recipients (out-of-band).
- **Lost key/IV:**  
  If lost, files cannot be decrypted—there is no recovery mechanism.

---

## Development Notes

- **Backend validation:** Only one of `expiry` or `maxDownloads` can be set for file access control.
- **User search:** `/api/users/search?search=abc` is used for sharing and access management.
- **KeyVaultManager:** Add this component to your navbar for vault export/import.
- **Encryption:** Always use a secure, modern browser for best cryptography support.

---

## How to Backup and Restore Your Vault

1. Go to **Key Vault** (navbar).
2. Click **Export Key Vault** – download the JSON file.
3. To restore: click **Import Key Vault** and select your backup JSON.

---