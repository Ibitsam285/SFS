const express = require("express")
const router = express.Router()
const { signUp, signIn } = require("../controllers/auth")
const { restrict } = require("../middlewares/auth")
const { validateBody } = require("../middlewares/validate")
const { signUpSchema, signInSchema } = require("../validators/user")

router.post("/signUp", validateBody(signUpSchema), signUp)
router.post("/signIn", validateBody(signInSchema), signIn)

module.exports = router