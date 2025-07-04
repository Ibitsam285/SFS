const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username:    { type: String, unique: true, sparse: true, trim: true },
  email:       { type: String, unique: true, sparse: true, trim: true },
  password:    { type: String, required: true },
  role:        { type: String, default: "user", enum: ["user", "admin"] },
  filesOwned:  [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
  groups:     [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notification" }]
});

module.exports = mongoose.model("User", UserSchema);