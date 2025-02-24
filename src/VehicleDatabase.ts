// VehicleDatabase.ts
// This file handles all operations related to storing and retrieving vehicles

// Define the structure of a vehicle record
export interface Vehicle {
  registrationNumber: string;
  dateAdded: string;
}

// Class to handle all vehicle database operations
export class VehicleDatabase {
  private readonly storageKey = "MyVehicles";

  // Get all vehicles from localStorage
  getVehicles(): Vehicle[] {
    const vehiclesJson = localStorage.getItem(this.storageKey);
    if (!vehiclesJson) {
      // If no vehicles exist yet, return an empty array
      return [];
    }

    try {
      // Parse the JSON string into an array of Vehicle objects
      return JSON.parse(vehiclesJson) as Vehicle[];
    } catch (error) {
      console.error("Error parsing vehicles from localStorage:", error);
      return [];
    }
  }

  // Add a new vehicle to the database
  addVehicle(registrationNumber: string): boolean {
    // Validate the registration number (basic validation - can be enhanced)
    if (!registrationNumber || registrationNumber.trim() === "") {
      return false;
    }

    // Format the registration number (uppercase and trimmed)
    const formattedRegNumber = registrationNumber.trim().toUpperCase();

    // Get the current list of vehicles
    const vehicles = this.getVehicles();

    // Check if the vehicle already exists
    if (vehicles.some((v) => v.registrationNumber === formattedRegNumber)) {
      console.warn("Vehicle already exists:", formattedRegNumber);
      return false;
    }

    // Create a new vehicle object with the current date
    const newVehicle: Vehicle = {
      registrationNumber: formattedRegNumber,
      dateAdded: new Date().toLocaleDateString(),
    };

    // Add the new vehicle to the array
    vehicles.push(newVehicle);

    // Save the updated array back to localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(vehicles));

    return true;
  }

  // Remove a vehicle from the database by registration number
  removeVehicle(registrationNumber: string): boolean {
    const vehicles = this.getVehicles();
    const initialLength = vehicles.length;

    // Filter out the vehicle with the matching registration number
    const updatedVehicles = vehicles.filter(
      (v) => v.registrationNumber !== registrationNumber
    );

    // If the length changed, we found and removed the vehicle
    if (updatedVehicles.length !== initialLength) {
      localStorage.setItem(this.storageKey, JSON.stringify(updatedVehicles));
      return true;
    }

    return false;
  }

  // Clear all vehicles from the database (for testing/reset purposes)
  clearAllVehicles(): void {
    localStorage.removeItem(this.storageKey);
  }
}

// Create a singleton instance to be used throughout the app
const vehicleDb = new VehicleDatabase();
export default vehicleDb;

// This export statement ensures TypeScript treats this file as a module
export {};
