const Notification = require("../models/notification");
const User = require("../models/user");

async function sendNotification({ recipientId, type, content }) {
  const notification = await Notification.create({
    recipientId,
    type,
    content
  });
  await User.findByIdAndUpdate(recipientId, { $push: { notifications: notification._id } });
  return notification;
}

async function markAsRead(notificationId) {
  return Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
}

async function markAllAsRead(userId) {
  return Notification.updateMany({ recipientId: userId, read: false }, { $set: { read: true } });
}

module.exports = { sendNotification, markAsRead, markAllAsRead };