const path = require("path");
const dotenv = require("dotenv");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const socketio = require("socket.io");

const connectDB = require("./src/config/db");

const authRouter = require("./src/routes/auth");
const userRouter = require("./src/routes/user");
const groupRouter = require("./src/routes/group");
const fileRouter = require("./src/routes/file");
const auditLogRouter = require("./src/routes/auditLog");
const notificationRouter = require("./src/routes/notification");

dotenv.config();

const app = express();
connectDB();

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use((req, res, next) => {
  const originalUrl = req.url;
  if (
    !originalUrl.startsWith("/api") &&
    (originalUrl.startsWith("/auth") ||
      originalUrl.startsWith("/users") ||
      originalUrl.startsWith("/groups") ||
      originalUrl.startsWith("/files") ||
      originalUrl.startsWith("/logs") ||
      originalUrl.startsWith("/notifications"))
  ) {
    req.url = `/api${req.url}`;
  }
  next();
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/groups", groupRouter);
app.use("/api/files", fileRouter);
app.use("/api/logs", auditLogRouter);
app.use("/api/notifications", notificationRouter);

app.get("/", (req, res) => {
  res.json({ status: "API working" });
});

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    socket.join(userId);
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});