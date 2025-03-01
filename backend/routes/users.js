// routes/users.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const {
  updateProfileValidation,
  addVehicleValidation,
} = require("../validators/user.validator");
const { validationResult } = require("express-validator");

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, updateProfileValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { name, email, phone } = req.body;

  // Build updated user object
  const userFields = {};
  if (name) userFields.name = name;
  if (email) userFields.email = email;
  if (phone) userFields.phone = phone;

  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user
    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { new: true }
    );

    res.json(user.toJSON());
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/users/change-role
// @desc    Toggle user role between 'user' and 'owner'
// @access  Private
router.put("/change-role", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Toggle role
    user.role = user.role === "user" ? "owner" : "user";
    await user.save();

    res.json({ message: `Role changed to ${user.role}`, user: user.toJSON() });
  } catch (error) {
    console.error("Change role error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/users/vehicles
// @desc    Add a vehicle
// @access  Private
router.post("/vehicles", auth, addVehicleValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { registrationNumber } = req.body;

  if (!registrationNumber) {
    return res.status(400).json({ message: "Registration number is required" });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if vehicle already exists
    const vehicleExists = user.vehicles.some(
      (v) =>
        v.registrationNumber.toUpperCase() === registrationNumber.toUpperCase()
    );

    if (vehicleExists) {
      return res.status(400).json({ message: "Vehicle already registered" });
    }

    // Add the new vehicle
    user.vehicles.push({ registrationNumber });
    await user.save();

    res.json(user.toJSON());
  } catch (error) {
    console.error("Add vehicle error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/users/vehicles/:registrationNumber
// @desc    Delete a vehicle
// @access  Private
router.delete("/vehicles/:registrationNumber", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the vehicle index
    const vehicleIndex = user.vehicles.findIndex(
      (v) =>
        v.registrationNumber.toUpperCase() ===
        req.params.registrationNumber.toUpperCase()
    );

    if (vehicleIndex === -1) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Remove the vehicle
    user.vehicles.splice(vehicleIndex, 1);
    await user.save();

    res.json(user.toJSON());
  } catch (error) {
    console.error("Delete vehicle error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
