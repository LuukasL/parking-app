import React, { useState, useEffect } from "react";
import { Mail, Phone, X, Trash2 } from "lucide-react";
import vehicleDb, { Vehicle } from "./VehicleDatabase";

// User profile data interface
interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

// Default profile data - in a real app, this would come from a backend
const defaultProfile: UserProfile = {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1 234 567 8900",
};

const Profile = () => {
  // State variables
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [plateInput, setPlateInput] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  // User profile state - initialize with default values
  const [profile, setProfile] = useState<UserProfile>(() => {
    // Try to load profile from localStorage
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      try {
        return JSON.parse(savedProfile);
      } catch (e) {
        console.error("Error parsing profile data:", e);
      }
    }
    return defaultProfile;
  });

  // Form state for editing profile
  const [editForm, setEditForm] = useState<UserProfile>({ ...profile });
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});

  // Load vehicles when the component mounts
  useEffect(() => {
    loadVehicles();
  }, []);

  // Function to load vehicles from the database
  const loadVehicles = () => {
    const loadedVehicles = vehicleDb.getVehicles();
    setVehicles(loadedVehicles);
  };

  // Handle adding a new vehicle
  const handleAddVehicle = () => {
    if (plateInput.trim()) {
      // Clear any previous error messages
      setErrorMessage("");

      // Try to add the vehicle to the database
      const success = vehicleDb.addVehicle(plateInput);

      if (success) {
        // Reload the vehicles to show the new one
        loadVehicles();
        // Reset the input field and close the modal
        setPlateInput("");
        setIsAddModalOpen(false);
      } else {
        // Show error message if the vehicle already exists
        setErrorMessage("This vehicle is already registered");
      }
    } else {
      // Show error message if the input is empty
      setErrorMessage("Please enter a registration number");
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (registrationNumber: string) => {
    setVehicleToDelete(registrationNumber);
    setIsDeleteModalOpen(true);
  };

  // Handle removing a vehicle
  const handleRemoveVehicle = () => {
    if (vehicleToDelete) {
      const success = vehicleDb.removeVehicle(vehicleToDelete);
      if (success) {
        loadVehicles();
      }
      setIsDeleteModalOpen(false);
      setVehicleToDelete(null);
    }
  };

  // Open edit profile modal
  const openEditModal = () => {
    setEditForm({ ...profile }); // Reset form to current profile values
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  // Handle edit form input changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate edit form
  const validateEditForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Validate name
    if (!editForm.name.trim()) {
      errors.name = "Name is required";
    }

    // Validate email
    if (!editForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(editForm.email)) {
      errors.email = "Email is invalid";
    }

    // Validate phone
    if (!editForm.phone.trim()) {
      errors.phone = "Phone number is required";
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle saving profile changes
  const handleSaveProfile = () => {
    if (validateEditForm()) {
      // Update profile state
      setProfile(editForm);

      // Save to localStorage for persistence
      localStorage.setItem("userProfile", JSON.stringify(editForm));

      // Close modal
      setIsEditModalOpen(false);
    }
  };

  return (
    <div
      style={{
        height: "100%",
        padding: "20px",
        backgroundColor: "#f9fafb",
        overflow: "auto",
        position: "relative",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        {/* User information section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "4px",
              }}
            >
              {profile.name}
            </h1>
            <p style={{ color: "#6b7280" }}></p>
          </div>
        </div>

        {/* Contact details section */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <Mail size={20} style={{ marginRight: "12px", color: "#6b7280" }} />
            <span>{profile.email}</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Phone
              size={20}
              style={{ marginRight: "12px", color: "#6b7280" }}
            />
            <span>{profile.phone}</span>
          </div>
        </div>

        {/* Vehicles section */}
        <div
          style={{
            backgroundColor: "#f3f4f6",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "16px",
            }}
          >
            My vehicles
          </h2>

          {/* Show message if no vehicles */}
          {vehicles.length === 0 ? (
            <p style={{ color: "#6b7280", fontStyle: "italic" }}>
              No vehicles added yet. Add your first vehicle.
            </p>
          ) : (
            /* Vehicles list */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.registrationNumber}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <div>
                    <p style={{ fontWeight: "bold", fontSize: "18px" }}>
                      {vehicle.registrationNumber}
                    </p>
                    <p style={{ color: "#6b7280", fontSize: "14px" }}>
                      Added: {vehicle.dateAdded}
                    </p>
                  </div>
                  <button
                    onClick={() => openDeleteModal(vehicle.registrationNumber)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ef4444", // Red color for delete
                      padding: "8px",
                    }}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons section */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#4ade80",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "12px",
          }}
        >
          Add Vehicle
        </button>

        <button
          onClick={openEditModal}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Edit Profile
        </button>
      </div>

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
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
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setErrorMessage("");
                setPlateInput("");
              }}
              style={{
                position: "absolute",
                right: "12px",
                top: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={20} color="#6b7280" />
            </button>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "16px",
              }}
            >
              Add New Vehicle
            </h3>

            {/* Input field for registration plate */}
            <input
              type="text"
              value={plateInput}
              onChange={(e) => setPlateInput(e.target.value)}
              placeholder="Enter registration plate"
              style={{
                width: "100%",
                padding: "12px",
                border: `1px solid ${errorMessage ? "#ef4444" : "#e5e7eb"}`,
                borderRadius: "8px",
                marginBottom: "8px",
                fontSize: "16px",
              }}
            />

            {/* Error message if any */}
            {errorMessage && (
              <p
                style={{
                  color: "#ef4444",
                  fontSize: "14px",
                  marginBottom: "16px",
                }}
              >
                {errorMessage}
              </p>
            )}

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: errorMessage ? "8px" : "16px",
              }}
            >
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setErrorMessage("");
                  setPlateInput("");
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddVehicle}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#4ade80",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Vehicle Modal */}
      {isDeleteModalOpen && vehicleToDelete && (
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
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setVehicleToDelete(null);
              }}
              style={{
                position: "absolute",
                right: "12px",
                top: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={20} color="#6b7280" />
            </button>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "16px",
              }}
            >
              Remove Vehicle
            </h3>

            <p
              style={{
                marginBottom: "24px",
              }}
            >
              Are you sure you want to remove vehicle{" "}
              <strong>{vehicleToDelete}</strong>?
            </p>

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
              }}
            >
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setVehicleToDelete(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveVehicle}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#ef4444", // Red for delete
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
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
              position: "relative",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setIsEditModalOpen(false)}
              style={{
                position: "absolute",
                right: "12px",
                top: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={20} color="#6b7280" />
            </button>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "20px",
              }}
            >
              Edit Profile
            </h3>

            {/* Edit form */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Name
              </label>
              <input
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `1px solid ${
                    editErrors.name ? "#ef4444" : "#e5e7eb"
                  }`,
                  borderRadius: "8px",
                  marginBottom: editErrors.name ? "4px" : "0",
                  fontSize: "16px",
                }}
              />
              {editErrors.name && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "14px",
                    marginTop: "4px",
                  }}
                >
                  {editErrors.name}
                </p>
              )}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleEditChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `1px solid ${
                    editErrors.email ? "#ef4444" : "#e5e7eb"
                  }`,
                  borderRadius: "8px",
                  marginBottom: editErrors.email ? "4px" : "0",
                  fontSize: "16px",
                }}
              />
              {editErrors.email && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "14px",
                    marginTop: "4px",
                  }}
                >
                  {editErrors.email}
                </p>
              )}
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={editForm.phone}
                onChange={handleEditChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `1px solid ${
                    editErrors.phone ? "#ef4444" : "#e5e7eb"
                  }`,
                  borderRadius: "8px",
                  marginBottom: editErrors.phone ? "4px" : "0",
                  fontSize: "16px",
                }}
              />
              {editErrors.phone && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "14px",
                    marginTop: "4px",
                  }}
                >
                  {editErrors.phone}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
              }}
            >
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
