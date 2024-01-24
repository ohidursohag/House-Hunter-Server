const mongoose = require("mongoose");
const HousesSchema = new mongoose.Schema({
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
    status: { type: String, default: "available" },
  });

  const housesModel = mongoose.model("houses", HousesSchema);
module.exports = housesModel;