import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useUser } from "./UserContext";
import parkingSpotDb, {
  ParkingSpot,
  Coordinates,
  TimeSlot,
} from "./ParkingSpotModel";
import bookingDb from "./BookingModel";
import { Plus, X, Clock, DollarSign, Check, Calendar, Car } from "lucide-react";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || "";

const ParkingMap = () => {
  const { role } = useUser();
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [location, setLocation] = useState<Coordinates>({
    lng: 24.9384,
    lat: 60.1699,
  });
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [isAddingSpot, setIsAddingSpot] = useState(false);
  const isAddingSpotRef = useRef(false);
  const [spotToDelete, setSpotToDelete] = useState<ParkingSpot | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSpotFormOpen, setIsSpotFormOpen] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<{
    northEast: Coordinates | null;
    southWest: Coordinates | null;
  }>({
    northEast: null,
    southWest: null,
  });
  const selectionBox = useRef<mapboxgl.Marker | null>(null);
  const startPoint = useRef<mapboxgl.LngLat | null>(null);
  const endPoint = useRef<mapboxgl.LngLat | null>(null);

  // Form state for adding new spots
  const [newSpotForm, setNewSpotForm] = useState({
    title: "",
    description: "",
    price: 0,
    currency: "EUR",
    timeSlots: [
      { dayOfWeek: 1, startHour: 8, endHour: 18 },
      { dayOfWeek: 2, startHour: 8, endHour: 18 },
      { dayOfWeek: 3, startHour: 8, endHour: 18 },
      { dayOfWeek: 4, startHour: 8, endHour: 18 },
      { dayOfWeek: 5, startHour: 8, endHour: 18 },
    ] as TimeSlot[],
  });

  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [bookingForm, setBookingForm] = useState({
    startTime: "",
    endTime: "",
    vehicleRegistration: "",
  });
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [bookingError, setBookingError] = useState("");

  // Load parking spots when component mounts
  useEffect(() => {
    const loadedSpots = parkingSpotDb.getParkingSpots();
    setParkingSpots(loadedSpots);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!map.current && mapContainer.current) {
      console.log("Initializing map");
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [location.lng, location.lat],
        zoom: 14,
      });

      map.current = mapInstance;

      // Add map controls
      mapInstance.addControl(new mapboxgl.NavigationControl());
      mapInstance.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
        })
      );

      // Setup click handler for spot selection
      mapInstance.on("click", (e) => {
        console.log("Map clicked, isAddingSpot:", isAddingSpot);
        if (isAddingSpotRef.current) {
          handleMapClick(e);
        }
      });

      mapInstance.on("load", () => {
        console.log("Map style loaded");
        // Load and display existing parking spots
        displayParkingSpots();
      });
    }
  }, []);

  // Update displayed parking spots whenever they change
  useEffect(() => {
    console.log("isAddingSpot changed:", isAddingSpot);
    if (map.current) {
      displayParkingSpots();
    }
  }, [parkingSpots]);

  // Handle user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lng: position.coords.longitude,
            lat: position.coords.latitude,
          });

          if (map.current) {
            map.current.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 14,
            });

            if (userMarker.current) {
              userMarker.current.remove();
            }

            userMarker.current = new mapboxgl.Marker({ color: "#3b82f6" })
              .setLngLat([position.coords.longitude, position.coords.latitude])
              .addTo(map.current);
          }
        },
        (error) => console.error(error)
      );
    }
  }, [map.current]);

  // Load vehicles when booking modal opens
  useEffect(() => {
    if (isBookingModalOpen && role === "user") {
      // Load user's vehicles from localStorage
      try {
        const vehiclesDb = localStorage.getItem("MyVehicles");
        if (vehiclesDb) {
          const parsedVehicles = JSON.parse(vehiclesDb);
          setVehicles(parsedVehicles.map((v: any) => v.registrationNumber));
        }
      } catch (error) {
        console.error("Error loading vehicles:", error);
      }
    }
  }, [isBookingModalOpen]);

  // Display all parking spots on the map
  const displayParkingSpots = () => {
    if (!map.current) return;

    // Remove existing markers first
    const markersToRemove = document.querySelectorAll(".parking-spot-marker");
    markersToRemove.forEach((marker) => {
      marker.remove();
    });

    // Add markers for each parking spot
    parkingSpots.forEach((spot) => {
      const center = calculateCenter(
        spot.coordinates.northEast,
        spot.coordinates.southWest
      );

      // Create a rectangle element
      const el = document.createElement("div");
      el.className = "parking-spot-marker";
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.backgroundColor = spot.active ? "#22c55e" : "#ef4444";
      el.style.borderRadius = "50%";
      el.style.cursor = "pointer";

      // Add marker and popup
      new mapboxgl.Marker(el).setLngLat([center.lng, center.lat]).setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<h3>${spot.title}</h3>
          <p>${spot.description || "No description provided"}</p>
          <p>Price: ${spot.price} ${spot.currency}/hour</p>
          <div>
            <button id="view-spot-${
              spot.id
            }" style="background-color: #3b82f6; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">
              ${role === "user" ? "Book Now" : "View Details"}
            </button>
            ${
              role === "owner"
                ? `<button id="delete-spot-${spot.id}" style="background-color: #ef4444; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">Delete</button>`
                : ""
            }
       </div>`
        )
      );
      if (map.current) {
        new mapboxgl.Marker(el)
          .setLngLat([center.lng, center.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<h3>${spot.title}</h3>
       <p>${spot.description || "No description provided"}</p>
       <p>Price: ${spot.price} ${spot.currency}/hour</p>
       <div style="display: flex; gap: 8px;">
         <button id="view-spot-${
           spot.id
         }" style="background-color: #3b82f6; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">
           ${role === "user" ? "Book Now" : "View Details"}
         </button>
         ${
           role === "owner"
             ? `<button id="delete-spot-${spot.id}" style="background-color: #ef4444; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">Delete</button>`
             : ""
         }
       </div>`
            )
          )
          .addTo(map.current);
        // Draw the parking spot rectangle
        drawParkingSpotRectangle(spot);
      }
    });

    // Add event listeners to the buttons in popups
    setTimeout(() => {
      parkingSpots.forEach((spot) => {
        const viewButton = document.getElementById(`view-spot-${spot.id}`);
        if (viewButton) {
          viewButton.addEventListener("click", () => {
            if (role === "user") {
              // Open booking modal
              setSelectedSpot(spot);
              setIsBookingModalOpen(true);

              // Set default booking time (now to 1 hour from now)
              const now = new Date();
              const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

              // Format as YYYY-MM-DDThh:mm
              const formatDateTime = (date: Date) => {
                return date.toISOString().slice(0, 16);
              };

              setBookingForm({
                startTime: formatDateTime(now),
                endTime: formatDateTime(oneHourLater),
                vehicleRegistration: vehicles[0] || "",
              });
            } else {
              // For owners - view details/edit
              console.log("View details for spot:", spot);
            }
          });
        }
        if (role == "owner") {
          const deleteButton = document.getElementById(
            `delete-spot-${spot.id}`
          );
          console.log("Delete button found:", deleteButton);
          if (deleteButton) {
            deleteButton.addEventListener("click", () => {
              console.log("Delete spot:", spot);
              setSpotToDelete(spot);
              setIsDeleteModalOpen(true);
            });
          }
        }
      });
    }, 100);
  };

  // Draw the parking spot rectangle on the map
  const drawParkingSpotRectangle = (spot: ParkingSpot) => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    try {
      // Check if there's an existing layer for this spot and remove it
      const existingLayerId = `spot-${spot.id}`;
      if (map.current.getLayer(existingLayerId)) {
        map.current.removeLayer(existingLayerId);
      }
      if (map.current.getSource(existingLayerId)) {
        map.current.removeSource(existingLayerId);
      }

      const { northEast, southWest } = spot.coordinates;

      // Add the rectangle as a fill layer
      map.current.addSource(existingLayerId, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [southWest.lng, southWest.lat],
                [northEast.lng, southWest.lat],
                [northEast.lng, northEast.lat],
                [southWest.lng, northEast.lat],
                [southWest.lng, southWest.lat],
              ],
            ],
          },
          properties: {},
        },
      });

      map.current.addLayer({
        id: existingLayerId,
        type: "fill",
        source: existingLayerId,
        layout: {},
        paint: {
          "fill-color": spot.active ? "#22c55e" : "#ef4444",
          "fill-opacity": 0.5,
          "fill-outline-color": "#3b82f6",
        },
      });
    } catch (error) {
      console.error("Error drawing parking spot:", error);
    }
  };

  // Calculate center point of a rectangle
  const calculateCenter = (ne: Coordinates, sw: Coordinates): Coordinates => {
    return {
      lng: sw.lng + (ne.lng - sw.lng) / 2,
      lat: sw.lat + (ne.lat - sw.lat) / 2,
    };
  };

  // Handle map clicks when adding a new parking spot
  const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
    if (!map.current) return;

    if (!startPoint.current) {
      // First click - set start point
      console.log("Setting first point");
      startPoint.current = e.lngLat;

      // Add marker at start point
      if (selectionBox.current) {
        selectionBox.current.remove();
      }

      const el = document.createElement("div");
      el.style.width = "10px";
      el.style.height = "10px";
      el.style.backgroundColor = "#3b82f6";
      el.style.borderRadius = "50%";

      selectionBox.current = new mapboxgl.Marker(el)
        .setLngLat(startPoint.current)
        .addTo(map.current);
    } else {
      // Second click - set end point and create rectangle
      console.log("Setting second point");
      endPoint.current = e.lngLat;

      // Remove temporary marker
      if (selectionBox.current) {
        selectionBox.current.remove();
        selectionBox.current = null;
      }

      // Set the selection bounds
      const bounds = {
        northEast: {
          lng: Math.max(startPoint.current.lng, endPoint.current.lng),
          lat: Math.max(startPoint.current.lat, endPoint.current.lat),
        },
        southWest: {
          lng: Math.min(startPoint.current.lng, endPoint.current.lng),
          lat: Math.min(startPoint.current.lat, endPoint.current.lat),
        },
      };

      setCurrentBounds(bounds);

      // Draw temporary rectangle
      const tempId = "temp-selection";
      if (map.current.getLayer(tempId)) {
        map.current.removeLayer(tempId);
      }
      if (map.current.getSource(tempId)) {
        map.current.removeSource(tempId);
      }

      map.current.addSource(tempId, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [bounds.southWest.lng, bounds.southWest.lat],
                [bounds.northEast.lng, bounds.southWest.lat],
                [bounds.northEast.lng, bounds.northEast.lat],
                [bounds.southWest.lng, bounds.northEast.lat],
                [bounds.southWest.lng, bounds.southWest.lat],
              ],
            ],
          },
          properties: {},
        },
      });

      map.current.addLayer({
        id: tempId,
        type: "fill",
        source: tempId,
        layout: {},
        paint: {
          "fill-color": "#3b82f6",
          "fill-opacity": 0.5,
          "fill-outline-color": "#3b82f6",
        },
      });

      // Open form to add details
      setIsSpotFormOpen(true);
      setIsAddingSpot(false);
    }
  };

  // Start the process of adding a new parking spot
  const startAddingSpot = () => {
    console.log("Starting to add spot");
    setIsAddingSpot(true);
    isAddingSpotRef.current = true;

    startPoint.current = null;
    endPoint.current = null;

    if (map.current) {
      map.current.getCanvas().style.cursor = "crosshair";
    }
  };

  const deleteParkingSpot = (spotId: string) => {
    console.log("Deleting with spot ID:", spotId);
    setParkingSpots((prev) => prev.filter((spot) => spot.id !== spotId));

    // In a real app, call API to delete from backend
    parkingSpotDb.deleteParkingSpot(spotId);

    setIsDeleteModalOpen(false);
    setSpotToDelete(null);
  };

  // Cancel adding a new parking spot
  const cancelAddingSpot = () => {
    setIsAddingSpot(false);
    isAddingSpotRef.current = false;
    setIsSpotFormOpen(false);
    startPoint.current = null;
    endPoint.current = null;

    if (map.current) {
      map.current.getCanvas().style.cursor = "";

      // Remove temporary rectangle if it exists
      const tempId = "temp-selection";
      if (map.current.getLayer(tempId)) {
        map.current.removeLayer(tempId);
      }
      if (map.current.getSource(tempId)) {
        map.current.removeSource(tempId);
      }
    }

    // Reset form state
    setNewSpotForm({
      title: "",
      description: "",
      price: 0,
      currency: "EUR",
      timeSlots: [
        { dayOfWeek: 1, startHour: 8, endHour: 18 },
        { dayOfWeek: 2, startHour: 8, endHour: 18 },
        { dayOfWeek: 3, startHour: 8, endHour: 18 },
        { dayOfWeek: 4, startHour: 8, endHour: 18 },
        { dayOfWeek: 5, startHour: 8, endHour: 18 },
      ],
    });
  };

  // Handle form input changes
  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setNewSpotForm((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) : value,
    }));
  };

  // Handle time slot changes
  const handleTimeSlotChange = (
    index: number,
    field: "dayOfWeek" | "startHour" | "endHour",
    value: number
  ) => {
    setNewSpotForm((prev) => {
      const updatedTimeSlots = [...prev.timeSlots];
      updatedTimeSlots[index] = {
        ...updatedTimeSlots[index],
        [field]: value,
      };
      return {
        ...prev,
        timeSlots: updatedTimeSlots,
      };
    });
  };

  // Add a new time slot
  const addTimeSlot = () => {
    setNewSpotForm((prev) => ({
      ...prev,
      timeSlots: [
        ...prev.timeSlots,
        { dayOfWeek: 1, startHour: 8, endHour: 18 },
      ],
    }));
  };

  // Remove a time slot
  const removeTimeSlot = (index: number) => {
    setNewSpotForm((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index),
    }));
  };

  // Save a new parking spot
  const saveNewSpot = () => {
    if (!currentBounds.northEast || !currentBounds.southWest) {
      console.error("Missing parking spot bounds");
      return;
    }

    // Create a new parking spot
    const newSpot = parkingSpotDb.addParkingSpot({
      ownerId: "current-user", // In a real app, this would be the user's ID
      title: newSpotForm.title || "Parking Spot",
      description: newSpotForm.description,
      price: newSpotForm.price,
      currency: newSpotForm.currency,
      coordinates: {
        northEast: currentBounds.northEast,
        southWest: currentBounds.southWest,
      },
      availableTimeSlots: newSpotForm.timeSlots,
      active: true,
    });

    // Add the new spot to the state
    setParkingSpots((prev) => [...prev, newSpot]);

    // Clean up
    cancelAddingSpot();

    // Remove the temporary rectangle
    if (map.current) {
      const tempId = "temp-selection";
      if (map.current.getLayer(tempId)) {
        map.current.removeLayer(tempId);
      }
      if (map.current.getSource(tempId)) {
        map.current.removeSource(tempId);
      }
    }
  };

  // Handle booking form input changes
  const handleBookingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear any existing error
    setBookingError("");
  };

  // Calculate booking duration in hours
  const calculateBookingDuration = () => {
    if (!bookingForm.startTime || !bookingForm.endTime) return 0;

    const start = new Date(bookingForm.startTime);
    const end = new Date(bookingForm.endTime);

    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    return Math.max(0, durationHours);
  };

  // Calculate total price for booking
  const calculateTotalPrice = () => {
    if (!selectedSpot) return 0;

    const duration = calculateBookingDuration();
    return selectedSpot.price * duration;
  };

  // Submit a booking
  const submitBooking = () => {
    if (!selectedSpot) return;

    // Validate booking
    if (!bookingForm.startTime || !bookingForm.endTime) {
      setBookingError("Please select start and end times");
      return;
    }

    if (!bookingForm.vehicleRegistration) {
      setBookingError("Please select a vehicle");
      return;
    }

    const start = new Date(bookingForm.startTime);
    const end = new Date(bookingForm.endTime);

    if (start >= end) {
      setBookingError("End time must be after start time");
      return;
    }

    // Check if the spot is available for the selected time
    const isAvailable = bookingDb.isParkingSpotAvailable(
      selectedSpot.id,
      start,
      end
    );

    if (!isAvailable) {
      setBookingError(
        "This parking spot is not available for the selected time"
      );
      return;
    }

    // Create the booking
    const totalPrice = calculateTotalPrice();

    bookingDb.createBooking({
      parkingSpotId: selectedSpot.id,
      userId: "current-user", // In a real app, this would be the user's ID
      vehicleRegistration: bookingForm.vehicleRegistration,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      totalPrice,
      status: "confirmed",
    });

    // Close the modal
    setIsBookingModalOpen(false);
    setSelectedSpot(null);

    // Show confirmation (in a real app, this could be a toast notification)
    alert("Booking confirmed!");
  };

  // Render day of week as text
  const renderDayOfWeek = (day: number) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[day] || "Unknown";
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={mapContainer}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* FAB for adding new parking spot (owners only) */}
      {role === "owner" && (
        <button
          onClick={startAddingSpot}
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            width: "56px",
            height: "56px",
            borderRadius: "28px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          <Plus size={24} />
        </button>
      )}

      {/* Instructions for adding a spot */}
      {isAddingSpot && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "white",
            padding: "12px 16px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            zIndex: 10,
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold" }}>
            Click to set the corners of your parking spot
          </p>
          <button
            onClick={cancelAddingSpot}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={16} color="#6b7280" />
          </button>
        </div>
      )}

      {/* New parking spot form */}
      {isSpotFormOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "20px" }}>
                Add New Parking Spot
              </h2>
              <button
                onClick={cancelAddingSpot}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>

            {/* Basic info */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Title
              </label>
              <input
                type="text"
                name="title"
                value={newSpotForm.title}
                onChange={handleFormChange}
                placeholder="e.g., Covered Parking near City Center"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "16px",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Description
              </label>
              <textarea
                name="description"
                value={newSpotForm.description}
                onChange={handleFormChange}
                placeholder="e.g., Easily accessible parking spot with security cameras"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "16px",
                  minHeight: "80px",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Pricing */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
                alignItems: "flex-end",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  Price per hour
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f3f4f6",
                      padding: "10px",
                    }}
                  >
                    <DollarSign size={20} color="#6b7280" />
                  </div>
                  <input
                    type="number"
                    name="price"
                    value={newSpotForm.price}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    style={{
                      flex: 1,
                      padding: "10px",
                      border: "none",
                      fontSize: "16px",
                    }}
                  />
                </div>
              </div>

              <div style={{ width: "80px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  Currency
                </label>
                <select
                  name="currency"
                  value={newSpotForm.currency}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: "white",
                  }}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            {/* Available time slots */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <label style={{ fontWeight: "500" }}>
                  Available Time Slots
                </label>
                <button
                  onClick={addTimeSlot}
                  style={{
                    backgroundColor: "#f3f4f6",
                    color: "#3b82f6",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Plus size={16} />
                  Add Slot
                </button>
              </div>

              {newSpotForm.timeSlots.map((slot, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#f9fafb",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    position: "relative",
                  }}
                >
                  <button
                    onClick={() => removeTimeSlot(index)}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display:
                        newSpotForm.timeSlots.length > 1 ? "block" : "none",
                    }}
                  >
                    <X size={16} color="#6b7280" />
                  </button>

                  <div
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  >
                    <div style={{ minWidth: "140px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "14px",
                          color: "#6b7280",
                        }}
                      >
                        Day
                      </label>
                      <select
                        value={slot.dayOfWeek}
                        onChange={(e) =>
                          handleTimeSlotChange(
                            index,
                            "dayOfWeek",
                            parseInt(e.target.value)
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "14px",
                          backgroundColor: "white",
                        }}
                      >
                        <option value={0}>Sunday</option>
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday</option>
                        <option value={6}>Saturday</option>
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "14px",
                          color: "#6b7280",
                        }}
                      >
                        Start Time
                      </label>
                      <select
                        value={slot.startHour}
                        onChange={(e) =>
                          handleTimeSlotChange(
                            index,
                            "startHour",
                            parseInt(e.target.value)
                          )
                        }
                        style={{
                          width: "80px",
                          padding: "8px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "14px",
                          backgroundColor: "white",
                        }}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i.toString().padStart(2, "0")}:00
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "14px",
                          color: "#6b7280",
                        }}
                      >
                        End Time
                      </label>
                      <select
                        value={slot.endHour}
                        onChange={(e) =>
                          handleTimeSlotChange(
                            index,
                            "endHour",
                            parseInt(e.target.value)
                          )
                        }
                        style={{
                          width: "80px",
                          padding: "8px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "14px",
                          backgroundColor: "white",
                        }}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i.toString().padStart(2, "0")}:00
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={cancelAddingSpot}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "white",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveNewSpot}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Check size={18} />
                Save Parking Spot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking modal */}
      {isBookingModalOpen && selectedSpot && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "450px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "20px" }}>Book Parking Spot</h2>
              <button
                onClick={() => {
                  setIsBookingModalOpen(false);
                  setSelectedSpot(null);
                  setBookingError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", margin: "0 0 8px 0" }}>
                {selectedSpot.title}
              </h3>
              <p style={{ margin: "0 0 8px 0", color: "#6b7280" }}>
                {selectedSpot.description || "No description provided"}
              </p>
              <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>
                Price: {selectedSpot.price} {selectedSpot.currency}/hour
              </p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Calendar size={18} color="#6b7280" />
                  Start Time
                </div>
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={bookingForm.startTime}
                onChange={handleBookingChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "16px",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Calendar size={18} color="#6b7280" />
                  End Time
                </div>
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={bookingForm.endTime}
                onChange={handleBookingChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "16px",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Car size={18} color="#6b7280" />
                  Vehicle
                </div>
              </label>
              {vehicles.length > 0 ? (
                <select
                  name="vehicleRegistration"
                  value={bookingForm.vehicleRegistration}
                  onChange={handleBookingChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle} value={vehicle}>
                      {vehicle}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  style={{
                    backgroundColor: "#fee2e2",
                    color: "#b91c1c",
                    padding: "10px",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                >
                  No vehicles found. Please add a vehicle in your profile first.
                </div>
              )}
            </div>

            {/* Booking summary */}
            <div
              style={{
                backgroundColor: "#f9fafb",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
                Booking Summary
              </h4>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span>Duration:</span>
                <span>{calculateBookingDuration().toFixed(1)} hours</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                }}
              >
                <span>Total Price:</span>
                <span>
                  {calculateTotalPrice().toFixed(2)} {selectedSpot.currency}
                </span>
              </div>
            </div>

            {/* Error message */}
            {bookingError && (
              <div
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#b91c1c",
                  padding: "10px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "14px",
                }}
              >
                {bookingError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => {
                  setIsBookingModalOpen(false);
                  setSelectedSpot(null);
                  setBookingError("");
                }}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "white",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitBooking}
                disabled={vehicles.length === 0}
                style={{
                  padding: "10px 16px",
                  backgroundColor: vehicles.length > 0 ? "#3b82f6" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "500",
                  cursor: vehicles.length > 0 ? "pointer" : "not-allowed",
                }}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete confirmation modal */}
      {isDeleteModalOpen && spotToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Delete Parking Spot</h3>
            <p>Are you sure you want to delete "{spotToDelete.title}"?</p>
            <p>This action cannot be undone.</p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSpotToDelete(null);
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteParkingSpot(spotToDelete.id)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingMap;
