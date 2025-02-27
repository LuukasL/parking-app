// BookingModel.ts
// Model for parking spot bookings

export interface Booking {
  id: string;
  parkingSpotId: string;
  userId: string;
  vehicleRegistration: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  totalPrice: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export class BookingDatabase {
  private readonly storageKey = "ParkingBookings";

  // Get all bookings
  getBookings(): Booking[] {
    const bookingsJson = localStorage.getItem(this.storageKey);
    if (!bookingsJson) {
      return [];
    }

    try {
      return JSON.parse(bookingsJson) as Booking[];
    } catch (error) {
      console.error("Error parsing bookings from localStorage:", error);
      return [];
    }
  }

  // Get bookings by user ID
  getBookingsByUser(userId: string): Booking[] {
    const bookings = this.getBookings();
    return bookings.filter((booking) => booking.userId === userId);
  }

  // Get bookings for a specific parking spot
  getBookingsByParkingSpot(parkingSpotId: string): Booking[] {
    const bookings = this.getBookings();
    return bookings.filter(
      (booking) => booking.parkingSpotId === parkingSpotId
    );
  }

  // Check if a parking spot is available for a given time range
  isParkingSpotAvailable(
    parkingSpotId: string,
    start: Date,
    end: Date
  ): boolean {
    const overlappingBookings = this.getBookingsByParkingSpot(
      parkingSpotId
    ).filter((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      // Skip cancelled bookings
      if (booking.status === "cancelled") {
        return false;
      }

      // Check for time overlap
      return (
        (start <= bookingEnd && start >= bookingStart) || // Start time is within a booking
        (end <= bookingEnd && end >= bookingStart) || // End time is within a booking
        (start <= bookingStart && end >= bookingEnd) // The new booking completely contains an existing booking
      );
    });

    return overlappingBookings.length === 0;
  }

  // Create a new booking
  createBooking(
    booking: Omit<Booking, "id" | "createdAt" | "updatedAt">
  ): Booking {
    const bookings = this.getBookings();

    const newBooking: Booking = {
      ...booking,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    localStorage.setItem(this.storageKey, JSON.stringify(bookings));

    return newBooking;
  }

  // Update a booking
  updateBooking(updatedBooking: Booking): boolean {
    const bookings = this.getBookings();
    const index = bookings.findIndex(
      (booking) => booking.id === updatedBooking.id
    );

    if (index === -1) {
      return false;
    }

    bookings[index] = {
      ...updatedBooking,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(this.storageKey, JSON.stringify(bookings));
    return true;
  }

  // Cancel a booking
  cancelBooking(id: string): boolean {
    const bookings = this.getBookings();
    const index = bookings.findIndex((booking) => booking.id === id);

    if (index === -1) {
      return false;
    }

    bookings[index] = {
      ...bookings[index],
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(this.storageKey, JSON.stringify(bookings));
    return true;
  }
}

// Helper function to generate a unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Create a singleton instance to use throughout the app
const bookingDb = new BookingDatabase();
export default bookingDb;

export {};
