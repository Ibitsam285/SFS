const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { logAction } = require("../utils/auditLogger");
const { sendNotification } = require("../utils/notificationService");

async function getMe(req, res) {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
}

async function getUserById(req, res) {

  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
}

async function updateUser(req, res) {
  if (req.user._id !== req.params.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updates = {};
  if (req.body.username) updates.username = req.body.username;
  if (req.body.email) updates.email = req.body.email;

  if (req.body.username) {
    const existing = await User.findOne({ username: req.body.username, _id: { $ne: req.params.id } });
    if (existing) return res.status(409).json({ error: "Username already exists" });
  }
  if (req.body.email) {
    const existing = await User.findOne({ email: req.body.email, _id: { $ne: req.params.id } });
    if (existing) return res.status(409).json({ error: "Email already exists" });
  }

  if (req.body.oldPassword || req.body.newPassword) {
    if (req.user._id !== req.params.id) {
      return res.status(403).json({ error: "Only the user can change their password" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!valid) return res.status(401).json({ error: "Old password incorrect" });

    const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
    updates.password = await bcrypt.hash(req.body.newPassword, saltRounds);
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });

  const log = await logAction({
    actorId: req.user._id,
    action: "UPDATE_USER",
    targetType: "User",
    targetId: req.params.id
  });

  console.log("Audit log created:", log);
  
  res.json({ message: "User updated successfully", user });
}

async function deleteUser(req, res) {
  if (req.user._id !== req.params.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  await logAction({
    actorId: req.user._id,
    action: "DELETE_USER",
    targetType: "User",
    targetId: req.params.id
  });

  res.clearCookie("uid");
  res.json({ message: "User deleted successfully" });
}

async function listUsers(req, res) {
  const users = await User.find().select("-password");
  res.json(users);
}

async function changeUserRole(req, res) {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true, runValidators: true }
  ).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });

  await logAction({
    actorId: req.user._id,
    action: "CHANGE_USER_ROLE",
    targetType: "User",
    targetId: req.params.id
  });

  await sendNotification({
    recipientId: req.params.id,
    type: "ROLE_CHANGED",
    content: `Your role was changed to ${req.body.role} by admin.`
  });

  res.json({ message: "Role updated", user });
}

async function searchUsers(req, res) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const search = req.params.searchText || "";
  if (!search) return res.json([]);

  const users = await User.find({
    $or: [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ]
  })
    .limit(10)
    .select("_id username email");

  res.json(users);
}

module.exports = {
  getMe,
  getUserById,
  updateUser,
  deleteUser,
  listUsers,
  changeUserRole,
  searchUsers
};