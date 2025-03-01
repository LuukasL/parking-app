// routes/bookings.js
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const ParkingSpot = require("../models/ParkingSpot");
const auth = require("../middleware/auth");

// @route   GET /api/bookings
// @desc    Get all user's bookings
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    // Get current and upcoming bookings
    const currentBookings = await Booking.getCurrentAndUpcomingForUser(
      req.user.id
    );

    // Get past bookings
    const pastBookings = await Booking.getPastForUser(req.user.id);

    res.json({
      current: currentBookings,
      past: pastBookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/bookings/spot/:spotId
// @desc    Get all bookings for a parking spot
// @access  Private (owner only)
router.get("/spot/:spotId", auth, async (req, res) => {
  try {
    // Check if user is the owner of the parking spot
    const parkingSpot = await ParkingSpot.findById(req.params.spotId);

    if (!parkingSpot) {
      return res.status(404).json({ message: "Parking spot not found" });
    }

    if (parkingSpot.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these bookings" });
    }

    const bookings = await Booking.getForParkingSpot(req.params.spotId);

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching spot bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post("/", auth, async (req, res) => {
  const { parkingSpotId, vehicleRegistration, startTime, endTime } = req.body;

  if (!parkingSpotId || !vehicleRegistration || !startTime || !endTime) {
    return res.status(400).json({
      message:
        "Please provide parkingSpotId, vehicleRegistration, startTime, and endTime",
    });
  }

  try {
    // Find the parking spot
    const parkingSpot = await ParkingSpot.findById(parkingSpotId);

    if (!parkingSpot) {
      return res.status(404).json({ message: "Parking spot not found" });
    }

    // Check if the spot is available for the requested time
    const isAvailable = await Booking.checkAvailability(
      parkingSpotId,
      new Date(startTime),
      new Date(endTime)
    );

    if (!isAvailable) {
      return res
        .status(400)
        .json({
          message: "Parking spot is not available for the selected time",
        });
    }

    // Calculate the total price
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const durationHours = (endDate - startDate) / (1000 * 60 * 60);
    const totalPrice = parkingSpot.price * durationHours;

    // Create the booking
    const newBooking = new Booking({
      parkingSpot: parkingSpotId,
      user: req.user.id,
      vehicleRegistration,
      startTime: startDate,
      endTime: endDate,
      totalPrice,
      status: "confirmed", // In a real app, this might be 'pending' until payment
    });

    const savedBooking = await newBooking.save();

    // Populate the parking spot details for the response
    const populatedBooking = await Booking.findById(savedBooking._id)
      .populate("parkingSpot")
      .populate("user", "name email");

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update a booking (e.g., cancel)
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only the booking user can update it
    if (booking.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this booking" });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    )
      .populate("parkingSpot")
      .populate("user", "name email");

    res.json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Cancel a booking
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only the booking user can cancel it
    if (booking.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this booking" });
    }

    // Instead of deleting, just set status to cancelled
    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
