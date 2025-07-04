const express = require("express");
const router = express.Router();
const {
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  addMembers,
  removeMembers,
  listGroups,
  listAllGroups,
} = require("../controllers/group");
const { restrict, restrictRole } = require("../middlewares/auth");
const { validateBody } = require("../middlewares/validate");
const {
  createGroupSchema,
  updateGroupSchema,
  memberOpsSchema,
} = require("../validations/group");

router.get("/all", restrict, restrictRole(["admin"]), listAllGroups);
router.get("/", restrict, listGroups);
router.post("/", restrict, validateBody(createGroupSchema), createGroup);
router.get("/:id", restrict, getGroup);
router.patch("/:id", restrict, validateBody(updateGroupSchema), updateGroup);
router.delete("/:id", restrict, deleteGroup);
router.post("/:id/members", restrict, validateBody(memberOpsSchema), addMembers);
router.delete("/:id/members", restrict, validateBody(memberOpsSchema), removeMembers);

module.exports = router;