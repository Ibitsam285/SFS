const path = require("path")
const dotenv = require('dotenv');
const express = require('express');
const cookieParser = require("cookie-parser")
const connectDB = require("./src/config/db")

const cors = require('cors');

const authRouter = require("./src/routes/auth")
const userRouter = require("./src/routes/user");
const groupRouter = require("./src/routes/group");
const fileRouter = require("./src/routes/file");
const auditLogRouter = require("./src/routes/auditLog");
const notificationRouter = require("./src/routes/notification");
dotenv.config();

const app = express();

connectDB()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true 
}));

app.use("/api/auth", authRouter)
app.use("/api/users", userRouter)
app.use("/api/groups", groupRouter)
app.use("/api/files", fileRouter)
app.use("/api/logs", auditLogRouter);
app.use("/api/notifications", notificationRouter);

app.get("/", (req, res) => {
  res.json({ status: "API working" })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})