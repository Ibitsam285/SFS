const Group = require("../models/group");
const User = require("../models/user");
const { logAction } = require("../utils/auditLogger");
const { sendNotification } = require("../utils/notificationService");

async function listAllGroups(req, res) {
  const groups = await Group.find();
  res.json(groups);
}

async function listGroups(req, res) {
  const searchTerm = req.query.search;

  const query = {
    members: req.user._id,
  };

  if (searchTerm) {
    query.name = { $regex: searchTerm, $options: "i" };
  }

  try {
    const groups = await Group.find(query);
    res.json(groups);
  } catch (err) {
    console.error("Error listing groups:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function createGroup(req, res) {
  const { name, members = [] } = req.body;
  const uniqueMembers = Array.from(new Set([...members, req.user._id.toString()]));
  const group = await Group.create({ name, members: uniqueMembers, owner: req.user._id });
  await User.updateMany(
    { _id: { $in: uniqueMembers } },
    { $addToSet: { groups: group._id } }
  );

  await logAction({
    actorId: req.user._id,
    action: "CREATE_GROUP",
    targetType: "Group",
    targetId: group._id
  });

  const notifyIds = uniqueMembers.filter(id => id.toString() !== req.user._id.toString());
  for (const memberId of notifyIds) {
    const notification = await sendNotification({
      recipientId: memberId,
      type: "GROUP_ADDED",
      content: `You were added to group "${name}".`
    });
    req.app.get("io").to(memberId.toString()).emit("notification", notification);
  }

  res.status(201).json(group);
}

async function getGroup(req, res) {
  const group = await Group.findById(req.params.id)
    .populate("members", "username email")
    .populate("owner", "username email");
  if (!group) return res.status(404).json({ error: "Group not found" });
  if (!group.members.some(m => m._id.equals(req.user._id)) && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  res.json(group);
}

async function updateGroup(req, res) {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: "Group not found" });
  if (!group.owner.equals(req.user._id) && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  group.name = req.body.name;
  await group.save();

  await logAction({
    actorId: req.user._id,
    action: "UPDATE_GROUP",
    targetType: "Group",
    targetId: group._id
  });

  res.json(group);
}

async function deleteGroup(req, res) {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: "Group not found" });
  if (!group.owner.equals(req.user._id) && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  await User.updateMany(
    { _id: { $in: group.members } },
    { $pull: { groups: group._id } }
  );
  await Group.deleteOne({ _id: req.params.id });

  await logAction({
    actorId: req.user._id,
    action: "DELETE_GROUP",
    targetType: "Group",
    targetId: group._id
  });

  const notifyIds = group.members.filter(id => id.toString() !== req.user._id.toString());
  for (const memberId of notifyIds) {
    const notification = await sendNotification({
      recipientId: memberId,
      type: "GROUP_REMOVED",
      content: `Group "${group.name}" was deleted.`
    });
    req.app.get("io").to(memberId.toString()).emit("notification", notification);
  }

  res.json({ message: "Group deleted" });
}

async function addMembers(req, res) {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: "Group not found" });
  if (!group.owner.equals(req.user._id) && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  const userIds = req.body.userIds.filter(id => !group.members.includes(id));
  group.members = [...group.members, ...userIds];
  await group.save();
  await User.updateMany({ _id: { $in: userIds } }, { $addToSet: { groups: group._id } });

  await logAction({
    actorId: req.user._id,
    action: "ADD_GROUP_MEMBER",
    targetType: "Group",
    targetId: group._id
  });

  for (const memberId of userIds) {
    const notification = await sendNotification({
      recipientId: memberId,
      type: "GROUP_ADDED",
      content: `You were added to group "${group.name}".`
    });
    req.app.get("io").to(memberId.toString()).emit("notification", notification);
  }

  res.json(group);
}

async function removeMembers(req, res) {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: "Group not found" });
  if (!group.owner.equals(req.user._id) && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  const userIds = req.body.userIds;
  group.members = group.members.filter(id => !userIds.includes(id.toString()));
  if (!group.members.includes(group.owner.toString()))
    group.members.push(group.owner);
  await group.save();
  await User.updateMany({ _id: { $in: userIds } }, { $pull: { groups: group._id } });

  await logAction({
    actorId: req.user._id,
    action: "REMOVE_GROUP_MEMBER",
    targetType: "Group",
    targetId: group._id
  });

  for (const memberId of userIds) {
    const notification = await sendNotification({
      recipientId: memberId,
      type: "GROUP_REMOVED",
      content: `You were removed from group "${group.name}".`
    });
    req.app.get("io").to(memberId.toString()).emit("notification", notification);
  }

  res.json(group);
}

module.exports = {
  listGroups,
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  addMembers,
  removeMembers,
  listAllGroups
};