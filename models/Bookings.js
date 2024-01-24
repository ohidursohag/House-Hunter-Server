const mongoose = require("mongoose");
const bookingsSchema = new mongoose.Schema({
  name: String,
  address: String,
  city: String,
  bedrooms: String,
  bathrooms: String,
  size: String,
  image: String,
  date: Date,
  rent: String,
  number: String,
  des: String,
  email: String,
  owner_name: String,
  status: String,
  R_name: String,
  R_number: String,
  R_email: String,
});

const bookingsModel = mongoose.model("bookings", bookingsSchema);
module.exports = bookingsModel;
