const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  profileImage: String,
  password: String,
  userRole: String,
  phoneNumber: Number,
});

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;
