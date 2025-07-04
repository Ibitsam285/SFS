const express = require("express")
const router = express.Router()
const { signUp, signIn, logOut } = require("../controllers/auth")
const { validateBody } = require("../middlewares/validate")
const { signUpSchema, signInSchema } = require("../validations/auth")
const { restrict } = require("../middlewares/auth")

router.post("/signUp", validateBody(signUpSchema), signUp)
router.post("/signIn", validateBody(signInSchema), signIn)
router.post("/signOut", restrict, logOut)

module.exports = router