// ParkingSpotModel.ts
// Model for parking spots

export interface Coordinates {
  lng: number;
  lat: number;
}

export interface TimeSlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startHour: number; // 0-23
  endHour: number; // 0-23
}

export interface ParkingSpot {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  price: number; // Price per hour
  currency: string;
  coordinates: {
    northEast: Coordinates;
    southWest: Coordinates;
  };
  availableTimeSlots: TimeSlot[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookingStatus {
  available: boolean;
  bookedBy: string | null;
  startTime: string | null;
  endTime: string | null;
}

export type ParkingSpotWithStatus = ParkingSpot & {
  status: BookingStatus;
};

// Class to handle all parking spot database operations
export class ParkingSpotDatabase {
  private readonly storageKey = "ParkingSpots";

  // Get all parking spots from localStorage
  getParkingSpots(): ParkingSpot[] {
    const spotsJson = localStorage.getItem(this.storageKey);
    if (!spotsJson) {
      return [];
    }

    try {
      return JSON.parse(spotsJson) as ParkingSpot[];
    } catch (error) {
      console.error("Error parsing parking spots from localStorage:", error);
      return [];
    }
  }

  // Get parking spots by owner ID
  getParkingSpotsByOwner(ownerId: string): ParkingSpot[] {
    const spots = this.getParkingSpots();
    return spots.filter((spot) => spot.ownerId === ownerId);
  }

  // Get a specific parking spot by ID
  getParkingSpotById(id: string): ParkingSpot | undefined {
    const spots = this.getParkingSpots();
    return spots.find((spot) => spot.id === id);
  }

  // Add a new parking spot
  addParkingSpot(
    spot: Omit<ParkingSpot, "id" | "createdAt" | "updatedAt">
  ): ParkingSpot {
    const spots = this.getParkingSpots();

    const newSpot: ParkingSpot = {
      ...spot,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    spots.push(newSpot);
    localStorage.setItem(this.storageKey, JSON.stringify(spots));

    return newSpot;
  }

  // Update an existing parking spot
  updateParkingSpot(updatedSpot: ParkingSpot): boolean {
    const spots = this.getParkingSpots();
    const index = spots.findIndex((spot) => spot.id === updatedSpot.id);

    if (index === -1) {
      return false;
    }

    spots[index] = {
      ...updatedSpot,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(this.storageKey, JSON.stringify(spots));
    return true;
  }

  // Delete a parking spot
  deleteParkingSpot(id: string): boolean {
    const spots = this.getParkingSpots();
    const filteredSpots = spots.filter((spot) => spot.id !== id);

    if (filteredSpots.length === spots.length) {
      return false;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(filteredSpots));
    return true;
  }
}

// Helper function to generate a unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Create a singleton instance to use throughout the app
const parkingSpotDb = new ParkingSpotDatabase();
export default parkingSpotDb;

export {};
