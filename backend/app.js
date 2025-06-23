const path = require("path")
const dotenv = require('dotenv');
const express = require('express');
const cookieParser = require("cookie-parser")
const connectDB = require("./src/config/db")
const userRouter = require("./src/routes/user")

dotenv.config();

const app = express();

connectDB()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use("/api/auth", userRouter)

// Example: root route
app.get("/", (req, res) => {
  res.json({ status: "API working" })
})

app.use((err, req, res, next) => {
  // Basic error handler
  console.error(err)
  res.status(500).json({ error: "Internal Server Error" })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})