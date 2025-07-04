# Auth, User Management, File & Group Sharing API

---

## API Endpoints & Examples

### Auth

**Register**
```http
POST /api/auth/signUp
Content-Type: application/json

{
  "username": "alice",
  "email": "alice@example.com",
  "password": "strongpassword"
}
```

**Login**
```http
POST /api/auth/signIn
Content-Type: application/json

{
  "username": "alice",
  "password": "strongpassword"
}
```
- On success, a `uid` cookie is set for authentication.

**Log Out**
```http
POST /api/auth/logOut
Cookie: uid=...
```

---

### User

**Get own profile**
```http
GET /api/users/me
Cookie: uid=...
```

**Get user by ID**
```http
GET /api/users/{userId}
Cookie: uid=...
```

**Update user (username, email, password)**
```http
PATCH /api/users/{userId}
Cookie: uid=...

{
  "username": "newname",
  "email": "new@email.com",
  "oldPassword": "oldpass",
  "newPassword": "newpass"
}
```

**Delete user**
```http
DELETE /api/users/{userId}
Cookie: uid=...
```

**List all users (admin only)**
```http
GET /api/users
Cookie: uid=...
```

**Change user role (admin only)**
```http
PATCH /api/users/{userId}/role
Cookie: uid=...

{
  "role": "admin"
}
```

---

### Groups

**Create group**
```http
POST /api/groups
Cookie: uid=...

{
  "name": "Project Team",
  "members": ["<userId1>", "<userId2>"]
}
```

**List groups (where you are a member)**
```http
GET /api/groups
Cookie: uid=...
```

**Get group details**
```http
GET /api/groups/{groupId}
Cookie: uid=...
```

**Update group name**
```http
PATCH /api/groups/{groupId}
Cookie: uid=...

{
  "name": "New Team Name"
}
```

**Delete group**
```http
DELETE /api/groups/{groupId}
Cookie: uid=...
```

**Add members to group**
```http
POST /api/groups/{groupId}/members
Cookie: uid=...

{
  "userIds": ["<userId3>", "<userId4>"]
}
```

**Remove members from group**
```http
DELETE /api/groups/{groupId}/members
Cookie: uid=...

{
  "userIds": ["<userId3>"]
}
```

**List all groups (admin only)**
```http
GET /api/groups/all
Cookie: uid=...
```

---

### Files

**Upload file**
```http
POST /api/files
Cookie: uid=...

{
  "filename": "secret.txt",
  "encryptedData": "U29tZSBzZWNyZXQgdGV4dA==",
  "metadata": {
    "size": 17,
    "type": "text/plain"
  }
}
```

**List files (owned or accessible)**
```http
GET /api/files
Cookie: uid=...
```

**Get file metadata**
```http
GET /api/files/{fileId}
Cookie: uid=...
```

**Download file**
```http
GET /api/files/{fileId}/download
Cookie: uid=...
```

**Delete file**
```http
DELETE /api/files/{fileId}
Cookie: uid=...
```

**Update file access controls**
```http
PATCH /api/files/{fileId}/access
Cookie: uid=...

{
  "expiry": "2025-12-31T23:59:59.999Z",
  "maxDownloads": 3,
  "revoked": false
}
```

**Share file with users/groups**
```http
POST /api/files/{fileId}/share
Cookie: uid=...

{
  "userIds": ["<userId2>"],
  "groupIds": ["<groupId1>"]
}
```

**Revoke file access (users, groups, or all)**
```http
POST /api/files/{fileId}/revoke
Cookie: uid=...

{
  "userIds": ["<userId2>"]
}
```
or
```http
POST /api/files/{fileId}/revoke
Cookie: uid=...

{
  "all": true
}
```

**List all files (admin only)**
```http
GET /api/files/all
Cookie: uid=...
```


## Audit Log Endpoints

### Get audit logs for a user  
```http
GET /api/users/{userId}/logs
Cookie: uid=...
```

### Get audit logs for a file  
```http
GET /api/files/{fileId}/audit
Cookie: uid=...
```

### Get all logs for current user  
```http
GET /api/logs
Cookie: uid=...
```

### Get all logs (admin only)  
```http
GET /api/logs/all
Cookie: uid=...
```

---

## Notification Endpoints

### Get all notifications for current user  
```http
GET /api/notifications
Cookie: uid=...
```

### Mark a notification as read  
```http
PATCH /api/notifications/{notificationId}/read
Cookie: uid=...
```

### Mark all notifications as read  
```http
PATCH /api/notifications/read-all
Cookie: uid=...
```

### Admin sends notification to user  
```http
POST /api/notifications/admin
Cookie: uid=...

{
  "recipientId": "<userId>",
  "content": "This is an admin announcement."
}
```

---

## Actions that Trigger Audit Logs and Notifications

### When a file is shared to a user  
```http
POST /api/files/{fileId}/share
Cookie: uid=...

{
  "userIds": ["<userIdToShareWith>"]
}
```
- User receives a notification: "A file \"filename\" was shared with you."
- Audit log entry created for SHARE_FILE.

---

### When a user's access to a file is revoked  
```http
POST /api/files/{fileId}/revoke
Cookie: uid=...

{
  "userIds": ["<userIdToRevoke>"]
}
```
- User receives a notification: "Your access to file \"filename\" was revoked."
- Audit log entry created for REVOKE_FILE_ACCESS.

---

### When a user is added to a group  
```http
POST /api/groups/{groupId}/members
Cookie: uid=...

{
  "userIds": ["<userIdToAdd>"]
}
```
- User receives a notification: "You were added to group \"groupname\"."
- Audit log entry created for ADD_GROUP_MEMBER.

---

### When a user is removed from a group  
```http
DELETE /api/groups/{groupId}/members
Cookie: uid=...

{
  "userIds": ["<userIdToRemove>"]
}
```
- User receives a notification: "You were removed from group \"groupname\"."
- Audit log entry created for REMOVE_GROUP_MEMBER.

---

### When admin changes a user's role  
```http
PATCH /api/users/{userId}/role
Cookie: uid=...

{
  "role": "admin"
}
```
- User receives a notification: "Your role was changed to admin by admin."
- Audit log entry created for CHANGE_USER_ROLE.

---

### When a group is created  
```http
POST /api/groups
Cookie: uid=...

{
  "name": "Awesome Group",
  "members": ["<userId1>", "<userId2>"]
}
```
- All added users (except creator) receive a notification: "You were added to group \"Awesome Group\"."
- Audit log entry created for CREATE_GROUP.

---

### When a group is deleted  
```http
DELETE /api/groups/{groupId}
Cookie: uid=...
```
- All users (except deleter) receive a notification: "Group \"groupname\" was deleted."
- Audit log entry created for DELETE_GROUP.

---

---

## Environment Variables

| Variable      | Description                       | Example                   |
|---------------|-----------------------------------|---------------------------|
| PORT          | Server port                       | 3000                      |
| MONGO_URI     | MongoDB connection string         | mongodb://localhost/db    |
| JWT_SECRET    | JWT signing secret                | my_super_secret           |
| SALT_ROUNDS   | bcrypt salt rounds (integer)      | 10                        |
| NODE_ENV      | Node environment                  | development               |

---

## Running the App

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your config.
3. Start MongoDB and the server:
   ```
   npm start
   ```
