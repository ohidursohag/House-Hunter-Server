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
const housesModel = require("./models/house.js");
const bookingsModel = require("./models/Bookings.js");

// Middlewears
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Verify Access Token
const verifyToken = async (req, res, next) => {
  const accessToken = req.cookies?.accessToken;
  // console.log('Value of Access Token in MiddleWare -------->', accessToken);
  if (!accessToken) {
    return res.status(401).send({ message: "UnAuthorized Access", code: 401 });
  }
  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res
        .status(401)
        .send({ message: "UnAuthorized Access", code: 401 });
    }
    req.user = decoded;

    next();
  });
};

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
      return res.json({ error: true, message: "User already Registered" });
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

    return res.json({ error: false, message: "Registration successful" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Login route
app.post("/house-hunter/api/v1/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  try {
    console.log("Login end hit");
    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log(validPassword);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Create and send JWT token
    const token = jwt.sign(
      {
        fullName: user.fullName,
        email: user.email,
        profileImage: user.profileImage,
        userRole: user.userRole,
        phoneNumber: user.phoneNumber,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );
    res
      .cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .send({ success: true, token });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Clear access token when user logged out
app.get("/house-hunter/api/v1/logout", async (req, res) => {
  try {
    res
      .clearCookie("accessToken", {
        maxAge: 0,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .send({ success: true });
  } catch (error) {
    return res.send({ error: true, error: error.message });
  }
});

//Get All houses with every Filter and search
app.get("/house-hunter/api/v1/allHouses", async (req, res) => {
  try {
    const { limit, page, search, size, bedrooms, city, available } = req.query;
    const query = {};
    if (bedrooms) query.bedrooms = bedrooms;
    if (city) query.city = city;
    if (available) query.status = available;
    if (size) {
      // Add search conditions to the query
      query.$or = [{ size: { $regex: size, $options: "i" } }];
    }
    if (search) {
      // Add search conditions to the query
      query.$or = [{ name: { $regex: search, $options: "i" } }];
    }
    const skip = (page - 1) * limit || 0;
    const result = await housesModel
      .find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    return res.send(result);
  } catch (error) {
    return res.send({ error: true, message: error.message });
  }
});

// Get specific Owner Houses
app.get("/house-hunter/api/v1/myHouses/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const result = await housesModel.find({
      email: email,
    });
    console.log(result);
    return res.send(result);
  } catch (error) {
    return res.send({ error: true, message: error.message });
  }
});

// Get specific Renter Bookings
app.get("/house-hunter/api/v1/myBooks/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const result = await bookingsModel.find({
      R_email: email,
    });
    return res.send(result);
  } catch (error) {
    return res.send({ error: true, message: error.message });
  }
});

//Get single house by id
app.get("/house-hunter/api/v1/singleHouse/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await housesModel.findOne({
      _id: id,
    });
    return res.send(result);
  } catch (error) {
    return res.send({ error: true, message: error.message });
  }
});

//  Add new Houses
app.post("/house-hunter/api/v1/addHouse", async (req, res) => {
  try {
    const house = req.body;
    const newHouse = new housesModel(house);
    const result = await newHouse.save();
    return res.send(result);
  } catch (error) {
    return res.send({ error: true, message: error.message });
  }
});

// add bookings
app.post("/house-hunter/api/v1/addBook", async (req, res) => {
  try {
    const book = req.body;
    const previousBookings = await bookingsModel.find({ email: book.email });
    if (previousBookings.length < 2) {
      const bookDoc = new bookingsModel(book);
      const result = await bookDoc.save();
      return res.send(result);
    } else {
      res.send({
        success: false,
        error: "Booking limit exceed. You can book maximum 2 houses ",
      });
    }
  } catch (error) {
    return res.send({ error: true, message: error.message });
  }
});

// Update House Data by id
app.put("/house-hunter/api/v1/editHouse/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const {
      name,
      address,
      city,
      bedrooms,
      bathrooms,
      size,
      image,
      date,
      rent,
      number,
      des,
      email,
      owner_name,
    } = req.body;
    const query = {
      name,
      address,
      city,
      bedrooms,
      bathrooms,
      size,
      image,
      date,
      rent,
      number,
      des,
      email,
      owner_name,
    };
    const result = await housesModel.findOneAndUpdate({ _id: id }, query, {
      returnOriginal: false,
    });
    return res.send(result);
  } catch (error) {
    return res.send({ error: true, message: error.message });
  }
});

// Update House booking Status by id
app.patch("/house-hunter/api/v1/updateStatus/:id", async (req, res) => {
  try {
    const id = req.params.id;
  const query = {
    status: "booked",
  };
  const result = await housesModel.findOneAndUpdate({ _id: id }, query, {
    returnOriginal: false,
  });
 return res.send(result);
  } catch (error) {
    return res.send({ error: true, message: error.message });
  }
});




app.get("/", (req, res) => {
  res.send("Hello from House Hunter Server..");
});

app.listen(port, () => {
  console.log(`House Hunter is running on port ${port}`);
});
