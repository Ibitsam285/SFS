const Joi = require("joi");

const signUpSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30),
  email: Joi.string().email(),
  password: Joi.string().min(6).max(128).required()
}).or('username', 'email'); 

const signInSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30),
  email: Joi.string().email(),
  password: Joi.string().min(6).max(128).required()
}).or('username', 'email'); 

module.exports = { signUpSchema, signInSchema };