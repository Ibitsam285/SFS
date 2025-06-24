const Joi = require("joi");

const updateUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30),
  email: Joi.string().email(),
  oldPassword: Joi.string().min(6).max(128),
  newPassword: Joi.string().min(6).max(128),
}).or('username', 'email', 'oldPassword') 
  .with('oldPassword', 'newPassword')
  .with('newPassword', 'oldPassword');

const changeRoleSchema = Joi.object({
  role: Joi.string().valid("user", "admin").required()
});

module.exports = { updateUserSchema, changeRoleSchema };