const Joi = require("joi");

const uploadFileSchema = Joi.object({
  filename: Joi.string().required(),
  encryptedData: Joi.string().required(),
  metadata: Joi.object({
    size: Joi.number().required(),
    type: Joi.string().required(),
    uploadDate: Joi.date()
  }).required()
});

const updateAccessSchema = Joi.object({
  expiry: Joi.date().optional(),
  maxDownloads: Joi.number().optional(),
  revoked: Joi.boolean().optional()
});

const shareFileSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
  groupIds: Joi.array().items(Joi.string().hex().length(24)).optional()
}).or('userIds', 'groupIds');

const revokeFileSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
  groupIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
  all: Joi.boolean().optional()
}).or('userIds', 'groupIds', 'all');

module.exports = {
  uploadFileSchema,
  updateAccessSchema,
  shareFileSchema,
  revokeFileSchema
};