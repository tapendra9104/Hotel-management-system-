import { BookingRecord, RoomInventory, RoomRecord } from '../types/domain';
import { parseDate } from './dates';

function isOverlappingRange(booking: BookingRecord, checkIn: Date, checkOut: Date): boolean {
  if (booking.status === 'cancelled') {
    return false;
  }

  const bookingCheckIn = parseDate(booking.checkInDate);
  const bookingCheckOut = parseDate(booking.checkOutDate);

  if (!bookingCheckIn || !bookingCheckOut) {
    return false;
  }

  return bookingCheckIn < checkOut && bookingCheckOut > checkIn;
}

function buildAvailabilityMessage(availableRooms: number, totalRooms: number): string {
  if (availableRooms <= 0) {
    return 'Sold out for these dates';
  }

  if (availableRooms === totalRooms) {
    return `All ${totalRooms} rooms available`;
  }

  if (availableRooms === 1) {
    return 'Only 1 room left';
  }

  return `${availableRooms} of ${totalRooms} rooms available`;
}

export function computeRoomInventory(
  rooms: RoomRecord[],
  bookings: BookingRecord[],
  query: { checkIn?: string; checkOut?: string } = {}
): RoomInventory[] {
  const requestedCheckIn = parseDate(query.checkIn);
  const requestedCheckOut = parseDate(query.checkOut);
  const useDateRange = Boolean(requestedCheckIn && requestedCheckOut && requestedCheckOut > requestedCheckIn);

  return rooms.map((room) => {
    const totalRooms = Number(room.totalRooms) || 1;
    const overlappingBookings = useDateRange && requestedCheckIn && requestedCheckOut
      ? bookings
          .filter((booking) => booking.roomType === room.name)
          .filter((booking) => isOverlappingRange(booking, requestedCheckIn, requestedCheckOut))
      : [];

    const bookedRooms = overlappingBookings.reduce((total, booking) => {
      return total + (Number(booking.numberOfRooms) || 1);
    }, 0);

    const availableRooms = Math.max(0, totalRooms - bookedRooms);

    return {
      ...room,
      totalRooms,
      bookedRooms,
      availableRooms,
      isAvailable: availableRooms > 0,
      availabilityMessage: buildAvailabilityMessage(availableRooms, totalRooms)
    };
  });
}

export function getRoomInventoryByName(
  rooms: RoomRecord[],
  bookings: BookingRecord[],
  roomName: string,
  query: { checkIn?: string; checkOut?: string } = {}
): RoomInventory | null {
  return computeRoomInventory(rooms, bookings, query).find((room) => room.name === roomName) || null;
}

