const path = require("path")
const dotenv = require('dotenv');
const express = require('express');
const cookieParser = require("cookie-parser")

const connectDB = require("./src/config/db")

const userRouter = require("./src/routes/user")

const { restrict, restrictRole } = require("./src/middlewares/auth")

const app = express();

dotenv.config();

connectDB()

app.use(express.json())
app.use(express.urlencoded( {extended: false} ))
app.use(cookieParser())

app.use("/api/auth", userRouter)

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
