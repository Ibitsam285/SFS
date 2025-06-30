const path = require("path")
const dotenv = require('dotenv');
const express = require('express');
const cookieParser = require("cookie-parser")
const connectDB = require("./src/config/db")

const authRouter = require("./src/routes/auth")
const userRouter = require("./src/routes/user")
const fileRouter = require("./src/routes/file")
const groupRouter = require("./src/routes/group")

dotenv.config();

const app = express();

connectDB()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use("/api/auth", userRouter)
app.use("/api/user", authRouter)
app.use("/api/file", fileRouter)
app.use("/api/group", groupRouter)

app.get("/", (req, res) => {
  res.json({ status: "API working" })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})