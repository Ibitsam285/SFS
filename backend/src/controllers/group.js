const Group = require("../models/group");
const User = require("../models/user");
const { logAction } = require("../utils/auditLogger");

async function listAllGroups(req, res) {
  const groups = await Group.find();
  res.json(groups);
}

async function listGroups(req, res) {
  const groups = await Group.find({ members: req.user._id });
  res.json(groups);
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