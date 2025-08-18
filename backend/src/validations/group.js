const Joi = require("joi");

const createGroupSchema = Joi.object({
  name: Joi.string().min(3).max(40).required(),
  owner: Joi.string().hex().length(24).optional(),
  members: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

const updateGroupSchema = Joi.object({
  name: Joi.string().min(3).max(40).required(),
});

const memberOpsSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
});

module.exports = {
  createGroupSchema,
  updateGroupSchema,
  memberOpsSchema,
};