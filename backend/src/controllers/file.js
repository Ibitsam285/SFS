const File = require("../models/file");
const User = require("../models/user");
const { logAction } = require("../utils/auditLogger");
const { sendNotification } = require("../utils/notificationService");

async function listAllFiles(req, res) {
  const files = await File.find();
  res.json(files);
}

async function uploadFile(req, res) {
  const { filename, encryptedData, metadata } = req.body;
  const file = await File.create({
    filename,
    ownerId: req.user._id,
    recipients: [],
    recipientGroups: [],
    accessControl: {},
    encryptedData,
    metadata,
  });
  await User.findByIdAndUpdate(req.user._id, { $push: { filesOwned: file._id } });

  await logAction({
    actorId: req.user._id,
    action: "UPLOAD_FILE",
    targetType: "File",
    targetId: file._id
  });

  res.status(201).json(file);
}

async function listFiles(req, res) {
  const owned = await File.find({ ownerId: req.user._id });
  const shared = await File.find({ recipients: req.user._id });
  const groups = req.user.groups || [];
  const groupFiles = await File.find({ recipientGroups: { $in: groups } });
  const all = [...owned, ...shared, ...groupFiles]
    .filter((v, i, a) => a.findIndex(t => t._id.equals(v._id)) === i);

  await logAction({
    actorId: req.user._id,
    action: "LIST_FILES",
    targetType: "User",
    targetId: req.user._id
  });

  res.json(all);
}

async function getFile(req, res) {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  const allowed =
    file.ownerId.equals(req.user._id) ||
    file.recipients.some(id => id.equals(req.user._id)) ||
    (req.user.groups && file.recipientGroups.some(gid => req.user.groups.includes(gid)));
  if (!allowed && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });

  await logAction({
    actorId: req.user._id,
    action: "GET_FILE",
    targetType: "File",
    targetId: file._id
  });

  res.json(file);
}

async function downloadFile(req, res) {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  const allowed =
    file.ownerId.equals(req.user._id) ||
    file.recipients.some(id => id.equals(req.user._id)) ||
    (req.user.groups && file.recipientGroups.some(gid => req.user.groups.includes(gid)));
  if (!allowed && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  if (file.accessControl.revoked)
    return res.status(403).json({ error: "File access revoked" });
  if (file.accessControl.expiry && new Date() > file.accessControl.expiry)
    return res.status(403).json({ error: "File access expired" });
  if (file.accessControl.maxDownloads && file.accessControl.downloads >= file.accessControl.maxDownloads)
    return res.status(403).json({ error: "Max downloads reached" });
  file.accessControl.downloads = (file.accessControl.downloads || 0) + 1;
  await file.save();

  await logAction({
    actorId: req.user._id,
    action: "DOWNLOAD_FILE",
    targetType: "File",
    targetId: file._id
  });

  res.json({
    filename: file.filename,
    encryptedData: file.encryptedData,
    metadata: file.metadata,
  });
}

async function deleteFile(req, res) {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  if (!file.ownerId.equals(req.user._id) && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  await File.deleteOne({ _id: file._id });
  await User.findByIdAndUpdate(file.ownerId, { $pull: { filesOwned: file._id } });

  await logAction({
    actorId: req.user._id,
    action: "DELETE_FILE",
    targetType: "File",
    targetId: file._id
  });

  res.json({ message: "File deleted" });
}

async function updateAccess(req, res) {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  if (!file.ownerId.equals(req.user._id) && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  Object.assign(file.accessControl, req.body);
  await file.save();

  await logAction({
    actorId: req.user._id,
    action: "UPDATE_FILE_ACCESS",
    targetType: "File",
    targetId: file._id
  });

  res.json(file);
}

async function shareFile(req, res) {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  if (!file.ownerId.equals(req.user._id) && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  const { userIds = [], groupIds = [] } = req.body;
  const newUserRecipients = userIds.filter(
    id => !file.recipients.map(String).includes(id)
  );
  file.recipients = Array.from(new Set([...file.recipients, ...userIds]));
  file.recipientGroups = Array.from(new Set([...file.recipientGroups, ...groupIds]));
  await file.save();

  await logAction({
    actorId: req.user._id,
    action: "SHARE_FILE",
    targetType: "File",
    targetId: file._id
  });

  for (const recipientId of newUserRecipients) {
    await sendNotification({
      recipientId,
      type: "FILE_SHARED",
      content: `A file "${file.filename}" was shared with you.`
    });
  }


  res.json(file);
}

async function revokeFile(req, res) {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  if (!file.ownerId.equals(req.user._id) && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  const { userIds = [], groupIds = [], all = false } = req.body;

  let revokedUserIds = [];
  if (all) {
    revokedUserIds = file.recipients.map(String);
    file.recipients = [];
    file.recipientGroups = [];
    file.accessControl.revoked = true;
  } else {
    if (userIds.length) {
      revokedUserIds = file.recipients.filter(id => userIds.includes(id.toString())).map(String);
      file.recipients = file.recipients.filter(id => !userIds.includes(id.toString()));
    }
    if (groupIds.length)
      file.recipientGroups = file.recipientGroups.filter(id => !groupIds.includes(id.toString()));
  }
  await file.save();

  await logAction({
    actorId: req.user._id,
    action: "REVOKE_FILE_ACCESS",
    targetType: "File",
    targetId: file._id
  });

  for (const revokedId of revokedUserIds) {
    await sendNotification({
      recipientId: revokedId,
      type: "FILE_REVOKED",
      content: `Your access to file "${file.filename}" was revoked.`
    });
  }

  res.json(file);
}

module.exports = {
  uploadFile,
  listFiles,
  getFile,
  downloadFile,
  deleteFile,
  updateAccess,
  shareFile,
  revokeFile,
  listAllFiles,
};