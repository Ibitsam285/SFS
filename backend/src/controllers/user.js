const User = require("../models/user")
const { setUser } = require("../services/auth")
const bcrypt = require("bcryptjs")

async function signUp(req, res) {
    const { username, password } = req.body
    if (!username || !password)
        return res.status(400).json({ error: "username and password are required" })

    const existing = await User.findOne({ username })
    if (existing)
        return res.status(409).json({ error: "username already exists" })

    const hashed = await bcrypt.hash(password, 10)
    await User.create({ username, password: hashed })

    return res.status(201).json({ message: "Sign up successful!" })
}

async function signIn(req, res) {
    const { username, password } = req.body
    if (!username || !password)
        return res.status(400).json({ error: "username and password are required" })

    const user = await User.findOne({ username })
    if (!user)
        return res.status(401).json({ error: "Invalid credentials" })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
        return res.status(401).json({ error: "Invalid credentials" })

    const token = setUser(user)
    res.cookie("uid", token, { httpOnly: true, maxAge: 7*24*60*60*1000 }) // 7 days
    return res.json({ message: "Sign in successful!" })
}

module.exports = { signUp, signIn }