const express = require("express");
const router = express.Router();
const { restrict, restrictRole } = require("../middlewares/auth");
const {
  getOwnLogs,
  getAllLogs
} = require("../controllers/auditLog");

router.get("", restrict, getOwnLogs);
router.get("/all", restrict, restrictRole(["admin"]), getAllLogs);

module.exports = router;