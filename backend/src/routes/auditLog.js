const express = require("express");
const router = express.Router();
const { restrict, restrictRole } = require("../middlewares/auth");
const {
  getUserLogs,
  getFileLogs,
  getOwnLogs,
  getAllLogs
} = require("../controllers/auditLog");

router.get("/users/:id/logs", restrict, getUserLogs);
router.get("/files/:id/audit", restrict, getFileLogs);
router.get("/logs", restrict, getOwnLogs);
router.get("/logs/all", restrict, restrictRole(["admin"]), getAllLogs);

module.exports = router;