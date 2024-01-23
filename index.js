const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5001;
const dbUri = process.env.DB_uri;
const app = express();
const userModel = require("./models/user.js");
// Middlewears

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

main().catch((err) => console.log(err));

async function main() {
  // Connect to the MongoDB cluster
  await mongoose.connect(dbUri);
}

// Register route
app.post("/house-hunter/api/v1/register", async (req, res) => {
  const { fullName, email, profileImage, password, userRole, phoneNumber } =
    req.body;

  try {
    // console.log('register hit')
    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({error:true, message: "User already Registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
// console.log('Hash',hashedPassword)
    // Create new user
    const newUser = {
      fullName,
      email,
      profileImage,
      password: hashedPassword,
      userRole,
      phoneNumber,
    };
    // console.log(newUser);
    // Save user to database
    await userModel.create(newUser);

   return res.json({error: false, message: "Registration successful" });
  } catch (error) {
   return res.status(500).json({ message: "Internal server error" });
  }
});






















app.get("/", (req, res) => {
  res.send("Hello from House Hunter Server..");
});

app.listen(port, () => {
  console.log(`House Hunter is running on port ${port}`);
});
