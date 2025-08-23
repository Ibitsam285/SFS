# Secure File Sharing & Group Management Platform

A full-stack web application for secure file sharing, fine-grained access control, and group/user management. Built with a modern React frontend and Node.js/Express + MongoDB backend.

---

## Table of Contents

- [Key Features](#key-features)
- [System Overview](#system-overview)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [Setup & Installation](#setup--installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Usage Guide](#usage-guide)
- [API Overview](#api-overview)
- [Security & Audit](#security--audit)

---

## Key Features

- **User Authentication:** Secure login, registration, and role-based access (admin, user).
- **User & Group Management:** Admins can manage users, assign roles, and create/edit/delete groups.
- **File Upload & Management:** Upload, download, and delete files with metadata (size, type, upload date).
- **Access Control:**
  - Grant/revoke access to individual users or groups.
  - "Revoke All Access" capability for immediate lockdown.
- **Audit Logging:** All key actions (file access, permission changes, group/user edits) are logged and browsable in an admin audit log UI.
- **Modern UI:** Responsive, accessible, and user-friendly React interface.

---

## System Overview

### Frontend

- **Stack:** React, TailwindCSS, Axios
- **Key Components:**
  - **Auth Pages:** Login, registration, and protected routes.
  - **Admin Dashboards:** Manage users, groups, files, and logs.
  - **File Management:** Upload, view, download, and control access.
  - **Modals:** For confirmations, errors, and forms (group/user edit).
  - **Audit Log Viewer:** Filter, sort, and browse all actions.

### Backend

- **Stack:** Node.js, Express, MongoDB (Mongoose)
- **Core Models:**
  - **User:** username, email, password (hashed), role, group memberships, notifications, files owned.
  - **Group:** name, owner, member list.
  - **File:** filename, metadata, owner, recipients, recipientGroups, accessControl.
  - **AuditLog:** actor, action, target, timestamp, metadata.
  - **Notification:** recipientId, type, content, read, timestamp.
- **API Endpoints:**
  - `/api/auth/` for authentication
  - `/api/users/` for user management
  - `/api/groups/` for group management
  - `/api/files/` for file operations
  - `/api/logs/` for audit log viewing
  - `/api/notifications/` for notifications
- **Security:** JWT auth, password hashing, strict RBAC, input validation.
- **Audit:** All sensitive actions automatically logged.

---

## Setup & Installation

### Prerequisites

- Node.js (v22)
- npm / yarn
- MongoDB (local or Atlas cluster)

---

### Backend Setup

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   - Configure .env:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `PORT`
     - `SALT_ROUNDS`
     - `NODE_ENV=development`

3. **Start the server:**
   ```bash
   npm run dev
---

### Frontend Setup

1. **Open another terminal:**
   ```bash
   cd ../frontend
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Configure proxy (if needed):**
   - Configure Frontend .env:
     - `VITE_API_URL=http://localhost:{BACKEND_PORT}`
   - See `frontend/vite.config.json` for `"target"` pointing to your backend.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Visit:**  
   [http://localhost:5173](http://localhost:5173)

---

## Usage Guide

- **Login/Register:** Create an account or login as admin/user.
- **File Upload:** Upload new files, select recipients and/or groups or revoke all access.
- **Access Control:** Use the "Revoke All Access" toggle to instantly remove all permissions.
- **Group Management:** Admins can create groups, assign owners/members, and edit/delete groups.
- **User Management:** Edit user info, assign roles ("user", "admin"), delete users, and assign to groups.
- **Audit Logging:** Browse all admin/user actions in the "Audit Logs" section, with powerful filtering and sorting.
- **Error Handling:** All errors are shown in popup modals for clarity.

---

## API Overview

Some of crucual API routes:
- **Auth:**  
  - `POST /api/auth/signUp`
  - `POST /api/auth/signIn`
- **Users:**  
  - `GET/POST/PATCH/DELETE /api/users/`
- **Groups:**  
  - `GET/POST/PATCH/DELETE /api/groups/`
- **Files:**  
  - `GET/POST/DELETE /api/files/`
  - `PATCH /api/files/:id/access` (update access control)
  - `POST /api/files/:id/revoke` (lock down access)
- **Audit Logs:**  
  - `GET /api/logs/all`

All endpoints require JWT authentication unless registering/logging in.

---

## Security & Audit

- **Authentication:** JWT tokens, password hashing with bcrypt.
- **Authorization:** Role-based (admin/user), endpoint guards.
- **Input Validation:** All API endpoints validate inputs.
- **Audit:** Every sensitive action (file, user, group, access) is recorded in `AuditLog` and visible in the admin dashboard.

---
