// models/Booking.js
const mongoose = require("mongoose");

// Booking schema
const BookingSchema = new mongoose.Schema(
  {
    parkingSpot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingSpot",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleRegistration: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    paymentId: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: { updatedAt: "updatedAt" } }
);

// Index for efficient queries
BookingSchema.index({ parkingSpot: 1, startTime: 1, endTime: 1 });
BookingSchema.index({ user: 1 });
BookingSchema.index({ status: 1 });

// Method to check if a booking overlaps with the given time range
BookingSchema.methods.overlaps = function (startTime, endTime) {
  return (
    (startTime <= this.endTime && startTime >= this.startTime) ||
    (endTime <= this.endTime && endTime >= this.startTime) ||
    (startTime <= this.startTime && endTime >= this.endTime)
  );
};

// Static method to check if a parking spot is available for a given time range
BookingSchema.statics.checkAvailability = async function (
  parkingSpotId,
  startTime,
  endTime
) {
  const overlappingBookings = await this.find({
    parkingSpot: parkingSpotId,
    status: { $ne: "cancelled" },
    $or: [
      { startTime: { $lte: endTime }, endTime: { $gte: startTime } },
      { startTime: { $gte: startTime, $lte: endTime } },
      { endTime: { $gte: startTime, $lte: endTime } },
    ],
  });

  return overlappingBookings.length === 0;
};

// Static method to get current and upcoming bookings for a user
BookingSchema.statics.getCurrentAndUpcomingForUser = function (userId) {
  const now = new Date();

  return this.find({
    user: userId,
    status: { $in: ["confirmed", "pending"] },
    endTime: { $gte: now },
  })
    .sort({ startTime: 1 })
    .populate("parkingSpot");
};

// Static method to get past bookings for a user
BookingSchema.statics.getPastForUser = function (userId, limit = 10) {
  const now = new Date();

  return this.find({
    user: userId,
    $or: [
      { status: { $in: ["completed", "cancelled"] } },
      { endTime: { $lt: now } },
    ],
  })
    .sort({ startTime: -1 })
    .limit(limit)
    .populate("parkingSpot");
};

// Static method to get bookings for a parking spot
BookingSchema.statics.getForParkingSpot = function (parkingSpotId) {
  return this.find({
    parkingSpot: parkingSpotId,
    status: { $ne: "cancelled" },
  })
    .sort({ startTime: 1 })
    .populate("user", "name email");
};

const Booking = mongoose.model("Booking", BookingSchema);

module.exports = Booking;
