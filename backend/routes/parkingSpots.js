// routes/parkingSpots.js
const express = require("express");
const router = express.Router();
const ParkingSpot = require("../models/ParkingSpot");
const auth = require("../middleware/auth");

// @route   GET /api/parking-spots
// @desc    Get all parking spots
// @access  Public
router.get("/", async (req, res) => {
  try {
    const parkingSpots = await ParkingSpot.find({ active: true }).populate(
      "owner",
      "name"
    );
    res.json(parkingSpots);
  } catch (error) {
    console.error("Error fetching parking spots:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/parking-spots/nearby
// @desc    Get nearby parking spots by coordinates
// @access  Public
router.get("/nearby", async (req, res) => {
  const { lng, lat, radius } = req.query;

  if (!lng || !lat) {
    return res
      .status(400)
      .json({ message: "Longitude and latitude are required" });
  }

  try {
    const parkingSpots = await ParkingSpot.findNearby(
      parseFloat(lng),
      parseFloat(lat),
      radius ? parseFloat(radius) : 1
    );

    res.json(parkingSpots);
  } catch (error) {
    console.error("Error finding nearby spots:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/parking-spots/:id
// @desc    Get a parking spot by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const parkingSpot = await ParkingSpot.findById(req.params.id).populate(
      "owner",
      "name email phone"
    );

    if (!parkingSpot) {
      return res.status(404).json({ message: "Parking spot not found" });
    }

    res.json(parkingSpot);
  } catch (error) {
    console.error("Error fetching parking spot:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/parking-spots
// @desc    Create a new parking spot
// @access  Private (owner only)
router.post("/", auth, async (req, res) => {
  // Only owners can create parking spots
  if (req.user.role !== "owner") {
    return res
      .status(403)
      .json({ message: "Only parking spot owners can create spots" });
  }

  try {
    const newSpot = new ParkingSpot({
      ...req.body,
      owner: req.user.id,
    });

    const savedSpot = await newSpot.save();
    res.status(201).json(savedSpot);
  } catch (error) {
    console.error("Error creating parking spot:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/parking-spots/:id
// @desc    Update a parking spot
// @access  Private (owner only)
router.put("/:id", auth, async (req, res) => {
  try {
    let parkingSpot = await ParkingSpot.findById(req.params.id);

    if (!parkingSpot) {
      return res.status(404).json({ message: "Parking spot not found" });
    }

    // Check if user is the owner of the parking spot
    if (parkingSpot.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this parking spot" });
    }

    const updatedSpot = await ParkingSpot.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedSpot);
  } catch (error) {
    console.error("Error updating parking spot:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/parking-spots/:id
// @desc    Delete a parking spot
// @access  Private (owner only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const parkingSpot = await ParkingSpot.findById(req.params.id);

    if (!parkingSpot) {
      return res.status(404).json({ message: "Parking spot not found" });
    }

    // Check if user is the owner of the parking spot
    if (parkingSpot.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this parking spot" });
    }

    await ParkingSpot.findByIdAndDelete(req.params.id);

    res.json({ message: "Parking spot removed" });
  } catch (error) {
    console.error("Error deleting parking spot:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
