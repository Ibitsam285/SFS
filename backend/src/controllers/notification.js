const Notification = require("../models/notification");

async function getMyNotifications(req, res) {
  const notifications = await Notification.find({ recipientId: req.user._id }).sort({ timestamp: -1 });
  res.json(notifications);
}

async function markNotificationRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientId: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ error: "Notification not found" });
  res.json(notification);
}

async function markAllRead(req, res) {
  await Notification.updateMany({ recipientId: req.user._id, read: false }, { $set: { read: true } });
  res.json({ message: "All notifications marked as read" });
}

async function adminSendNotification(req, res) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const { recipientId, content } = req.body;
  const notification = await Notification.create({
    recipientId,
    type: "ADMIN",
    content
  });
  await require("../models/user").findByIdAndUpdate(recipientId, { $push: { notifications: notification._id } });
  res.status(201).json(notification);
}

module.exports = {
  getMyNotifications,
  markNotificationRead,
  markAllRead,
  adminSendNotification,
};