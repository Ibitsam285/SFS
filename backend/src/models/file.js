const mongoose = require("mongoose");

const FileMetadataSchema = new mongoose.Schema({
  size: { type: Number, required: true },
  type: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now }
}, { _id: false });

const AccessControlSchema = new mongoose.Schema({
  revoked: { type: Boolean, default: false }
}, { _id: false });

const FileSchema = new mongoose.Schema({
  filename:      { type: String, required: true },
  ownerId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipients:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  recipientGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
  accessControl: AccessControlSchema,
  encryptedData: { type: String, required: true },
  metadata:      FileMetadataSchema
});

module.exports = mongoose.model("File", FileSchema);