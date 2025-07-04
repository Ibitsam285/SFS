const User = require("../models/user")
const { setUser } = require("../services/auth")
const bcrypt = require("bcryptjs")

async function isFieldTaken(field, value) {
  if (!value) return false
  return !!(await User.findOne({ [field]: value }))
}

async function signUp(req, res) {
  const { username, email, password, role } = req.body
  console.log(req.body)
  if (!password)
    return res.status(400).json({ error: "Password is required" })
  if (!username && !email)
    return res.status(400).json({ error: "Username or email is required" })

  if (await isFieldTaken('username', username))
    return res.status(409).json({ error: "Username already exists" })
  if (await isFieldTaken('email', email))
    return res.status(409).json({ error: "Email already exists" })

  const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
  const hashed = await bcrypt.hash(password, saltRounds)
  const userData = { password: hashed }
  if (username) userData.username = username
  if (email) userData.email = email
  
  if (role) userData.role = role

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
  })
  return res.json({ message: "Sign in successful!" })
}

function logOut(req, res) {
  res.clearCookie("uid")
  return res.json({ message: "Logged out successfully!" })
}

module.exports = { signUp, signIn, logOut }