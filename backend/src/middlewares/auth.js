const { getUser } = require("../services/auth")

function restrict(req, res, next) {
  const token = req.cookies?.uid
  if (!token) return res.status(401).json({ error: "Unauthorized" })

  const user = getUser(token)
  if (!user) return res.status(401).json({ error: "Unauthorized" })

  req.user = user
  next()
}

function restrictRole(roles = []) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" })
    if (!req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden - insufficient role" })
    }
    next()
  }
}

module.exports = { restrict, restrictRole }