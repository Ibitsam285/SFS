const AuditLog = require("../models/auditLog");

async function logAction({ actorId, action, targetType, targetId }) {
  return AuditLog.create({
    actorId, action, targetType, targetId
  });
}

module.exports = { logAction };