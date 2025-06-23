const { getUser } = require("../services/auth")

async function restrict(req, res, next) {
    const uid = req.cookies?.uid
    
    if (!uid) return res.redirect("/api/auth/signIn")

    const user = getUser(uid)

    if (!user) return res.redirect("/api/auth/signIn")

    req.user = user
    next()
}

function restrictRole(roles = []) {
    return function (req, res, next) {
        if (!req.user) return res.redirect("/api/auth/signIn")
        
        if (!req.user.role || !roles.includes(req.user.role)) return res.status(401).end("Unauthorized")

        return next()
    }
}

module.exports = { restrict, restrictRole }
