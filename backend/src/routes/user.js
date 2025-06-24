const express = require("express");
const router = express.Router();
const {
  getMe,
  getUserById,
  updateUser,
  deleteUser,
  listUsers,
  changeUserRole,
} = require("../controllers/user");
const { restrict, restrictRole } = require("../middlewares/auth");
const { validateBody } = require("../middlewares/validate");
const { updateUserSchema, changeRoleSchema } = require("../validations/user");

router.get("/me", restrict, getMe);
router.get("/:id", restrict, getUserById);
router.patch("/:id", restrict, validateBody(updateUserSchema), updateUser);
router.delete("/:id", restrict, deleteUser);
router.get("/", restrict, restrictRole(["admin"]), listUsers);
router.patch("/:id/role", restrict, restrictRole(["admin"]), validateBody(changeRoleSchema), changeUserRole);

module.exports = router;