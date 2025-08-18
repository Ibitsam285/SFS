# Secure File Storage (SFS) Web App

A privacy-focused, end-to-end encrypted file storage and sharing web application.

---

## Features

- **End-to-end encryption:** All files are encrypted in-browser before upload.
- **User authentication:** Only registered users can upload/encrypt files.
- **File sharing:** Share files with other users or groups; manage access and permissions.
- **Access controls:** Set max downloads, expiry, or revoke access.
- **Key vault:** Securely store, export, and import your file encryption keys in the browser.
- **Guest decryption:** Anyone (even unauthenticated users) can decrypt files, given the encrypted file and its key+IV.
- **Admin dashboard:** Manage users, groups, files, and audit logs.
- **Role-based access:** Separate admin and user routes with robust 404 handling for unauthorized access.

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

### Routing & Access Control

- **Role-based routes:**  
  - **Admin-only pages:** `/manage-users`, `/manage-groups`, `/manage-files`, `/manage-logs`, etc.  
    - Only visible to admin users.  
    - Other users see a 404 page if they try to access these routes.
  - **User-only pages:** `/encrypt`, `/files`, `/groups`, `/keys`, `/settings`, etc.  
    - Admins see a 404 if trying to access user-only areas.
  - **Public/Guest:** `/signin`, `/signup`, `/decrypt`
- **404 Handling:**  
  - Any unauthorized or unknown route displays a custom 404 page.

### Main Pages & Components

- **`src/pages/EncryptFile.jsx`**  
  - Encrypt and upload files. Shows encryption key/IV. Allows saving to vault and downloading encrypted file.

- **`src/pages/DecryptFile.jsx`**  
  - Decrypt files as a logged-in user (auto-load keys) or guest (manual key input).

- **`src/components/ManageAccess.jsx`**  
  - Manage file sharing to users/groups, access controls, and revocation.

- **`src/components/KeyVaultManager.jsx`**  
  - Export/import all saved keys from/to the browser vault.

- **`src/pages/AdminManageUsers.jsx`**  
  - Admin CRUD management for users:
    - View users with username, email, role, owned files (names), and groups (names).
    - Edit/delete users. Change roles with confirmation.  
    - Add/remove user files and group memberships.
    - All user names and related data shown with proper alignment and light font colors.

- **`src/pages/AdminManageGroups.jsx`**  
  - Admin CRUD management for groups:
    - View groups with name, owner (username), and members (usernames).
    - Create/edit/delete groups.
    - Add/remove group members using multi-select.
    - All names shown, never raw IDs.

- **`src/pages/AdminManageFiles.jsx`**  
  - Admin management for all files:
    - Shows filename, owner, recipients (usernames), recipient groups, size, type, upload date, access controls (expiry, max downloads, revoked), and delete option.
    - All names resolved, clean UI with only necessary data.

- **`src/pages/AdminManageLogs.jsx`**  
  - Audit log viewer for admins:
    - Shows timestamp, actor (username/email), action, target type, and target ID.
    - Sortable columns (timestamp, actor, action, target type).
    - Filters by action, actor, or target type.
    - Custom-scrollbar, light font, and clear alignment.

- **`src/pages/SettingsPage.jsx`**  
  - Allows users (including admins) to update their own username, email, and password.
  - Uses `UserProfileSection` and `PasswordChangeSection` for editing and updating info.

- **`src/components/Navbar.jsx` / `src/components/AdminNavbar.jsx`**  
  - Adaptive navigation for user/admin roles.

- **`src/pages/NotFound.jsx`**  
  - Custom 404 page for unauthorized or unknown routes.

### Utilities

- **`src/utils/KeyVault.js`**  
  - Handles key storage, retrieval, export, and import.
  - Uses PBKDF2 to derive a vault key from a passphrase for encrypting individual file keys/IVs.

- **`src/utils/api.js`**  
  - Axios wrapper for API requests, with auth handling.

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

## Admin Dashboard Features

- **Manage Users:**  
  - View, edit, delete users. Change roles with confirmation.  
  - See files and groups for each user.
- **Manage Groups:**  
  - View, edit, delete groups. Add/remove members by username.
- **Manage Files:**  
  - View files with metadata, owners, recipients, and access controls. Delete files.
- **View Audit Logs:**  
  - Sortable, filterable logs with actor names, actions, and targets.
- **Settings:**  
  - Update your own admin username, email, or password.

---

## Development Notes

- **Backend validation:** Only one of `expiry` or `maxDownloads` can be set for file access control.
- **User search:** `/api/users/search/:searchText` is used for sharing and access management.
- **KeyVaultManager:** Add this component to your navbar for vault export/import.
- **Encryption:** Always use a secure, modern browser for best cryptography support.
- **Role-based Routing:** Unauthorized access to admin/user pages returns a 404, not a redirect.

---

## How to Backup and Restore Your Vault

1. Go to **Key Vault** (navbar).
2. Click **Export Key Vault** – download the JSON file.
3. To restore: click **Import Key Vault** and select your backup JSON.

---
