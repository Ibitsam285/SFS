const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
  actorId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action:     { type: String, required: true }, 
  targetType: { type: String, required: true }, 
  targetId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  timestamp:  { type: Date, default: Date.now }
});

module.exports = mongoose.model("AuditLog", AuditLogSchema);