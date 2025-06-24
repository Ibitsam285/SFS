const User = require("../models/user")
const { setUser } = require("../services/auth")
const bcrypt = require("bcryptjs")

async function isFieldTaken(field, value) {
  if (!value) return false
  return !!(await User.findOne({ [field]: value }))
}

async function signUp(req, res) {
  const { username, email, password } = req.body

  if (!password)
    return res.status(400).json({ error: "Password is required" })
  if (!username && !email)
    return res.status(400).json({ error: "Username or email is required" })

  if (await isFieldTaken('username', username))
    return res.status(409).json({ error: "Username already exists" })
  if (await isFieldTaken('email', email))
    return res.status(409).json({ error: "Email already exists" })

  const hashed = await bcrypt.hash(password, 10)
  const userData = { password: hashed }
  if (username) userData.username = username
  if (email) userData.email = email

  await User.create(userData)
  return res.status(201).json({ message: "Sign up successful!" })
}

async function signIn(req, res) {
  const { username, email, password } = req.body

  if (!password)
    return res.status(400).json({ error: "Password is required" })
  if (!username && !email)
    return res.status(400).json({ error: "Username or email is required" })

  const user = await User.findOne(
    username ? { username } : { email }
  )
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: "Invalid credentials" })

  const token = setUser(user)
  res.cookie("uid", token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return res.json({ message: "Sign in successful!" })
}

async function getMe(req, res) {
  res.json({ user: req.user })
}

module.exports = { signUp, signIn, getMe }