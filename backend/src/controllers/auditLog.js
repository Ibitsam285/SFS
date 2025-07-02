const AuditLog = require("../models/auditLog");

async function getUserLogs(req, res) {
  if (req.user._id.toString() !== req.params.id && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  const logs = await AuditLog.find({ targetType: "User", targetId: req.params.id }).sort({ timestamp: -1 });
  res.json(logs);
}

async function getFileLogs(req, res) {
  const logs = await AuditLog.find({ targetType: "File", targetId: req.params.id }).sort({ timestamp: -1 });
  res.json(logs);
}

async function getOwnLogs(req, res) {
  const logs = await AuditLog.find({ actorId: req.user._id }).sort({ timestamp: -1 });
  res.json(logs);
}

async function getAllLogs(req, res) {
  const logs = await AuditLog.find().sort({ timestamp: -1 });
  res.json(logs);
}

module.exports = {
  getUserLogs,
  getFileLogs,
  getOwnLogs,
  getAllLogs
};