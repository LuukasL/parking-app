// models/ParkingSpot.js
const mongoose = require("mongoose");

// Time slot schema (embedded document)
const TimeSlotSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
  },
  startHour: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
  },
  endHour: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
  },
});

// Coordinates schema (embedded document)
const CoordinatesSchema = new mongoose.Schema({
  lng: {
    type: Number,
    required: true,
  },
  lat: {
    type: Number,
    required: true,
  },
});

// Boundary schema (embedded document)
const BoundarySchema = new mongoose.Schema({
  northEast: {
    type: CoordinatesSchema,
    required: true,
  },
  southWest: {
    type: CoordinatesSchema,
    required: true,
  },
});

// Parking spot schema
const ParkingSpotSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      enum: ["USD", "EUR", "GBP"],
      default: "EUR",
    },
    coordinates: {
      type: BoundarySchema,
      required: true,
    },
    availableTimeSlots: [TimeSlotSchema],
    active: {
      type: Boolean,
      default: true,
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

// Add geospatial index for efficient location-based queries
ParkingSpotSchema.index({
  "coordinates.northEast.lng": 1,
  "coordinates.northEast.lat": 1,
  "coordinates.southWest.lng": 1,
  "coordinates.southWest.lat": 1,
});

// Static method to find nearby parking spots
ParkingSpotSchema.statics.findNearby = function (lng, lat, radiusInKm = 1) {
  // Earth's radius in kilometers
  const earthRadius = 6371;

  // Convert radius from km to radians
  const radiusInRadians = radiusInKm / earthRadius;

  // Convert coordinates to radians
  const lngRad = lng * (Math.PI / 180);
  const latRad = lat * (Math.PI / 180);

  // Calculate bounding box
  const maxLat = lat + (radiusInKm / earthRadius) * (180 / Math.PI);
  const minLat = lat - (radiusInKm / earthRadius) * (180 / Math.PI);
  const maxLng =
    lng + ((radiusInKm / earthRadius) * (180 / Math.PI)) / Math.cos(latRad);
  const minLng =
    lng - ((radiusInKm / earthRadius) * (180 / Math.PI)) / Math.cos(latRad);

  // Find spots within the bounding box
  return this.find({
    $and: [
      { "coordinates.northEast.lng": { $gte: minLng } },
      { "coordinates.southWest.lng": { $lte: maxLng } },
      { "coordinates.northEast.lat": { $gte: minLat } },
      { "coordinates.southWest.lat": { $lte: maxLat } },
      { active: true },
    ],
  }).populate("owner", "name email phone");
};

const ParkingSpot = mongoose.model("ParkingSpot", ParkingSpotSchema);

module.exports = ParkingSpot;
