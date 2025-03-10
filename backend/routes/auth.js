// routes/auth.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const {
  registerValidation,
  loginValidation,
} = require("../validators/auth.validator");
const { validationResult } = require("express-validator");
const { successResponse, errorResponse } = require("../utils/response");

// JWT secret - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json(errorResponse("Validation failed", 400, errors.array()));
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      role: role || "user",
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return user data and token
    res.status(201).json(
      successResponse(
        {
          token,
          user: user.toJSON(),
        },
        "User registered successfully"
      )
    );
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json(errorResponse("Server error"));
  }
});

// @route   POST /api/auth/login
// @desc    Log in a user
// @access  Public
router.post("/login", loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(errorResponse("Validation failed", 400, errors.array()));
  }
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return user data and token
    res.json(
      successResponse(
        {
          token,
          user: user.toJSON(),
        },
        "Login successful"
      )
    );
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json(errorResponse("Server error"));
  }
});

// @route   GET /api/auth/me
// @desc    Get current user data
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api
