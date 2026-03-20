import { Router } from 'express';
import {
  createBooking,
  deleteBooking,
  getBookingById,
  getBookingStats,
  getBookingsByEmail,
  listBookings,
  listRooms,
  updateBooking
} from '../lib/room-store';
import { adminAuth, auth } from '../middleware/auth';
import { BookingRecord } from '../types/domain';
import { nightsBetween, parseDate } from '../utils/dates';
import { createBookingReference, createObjectIdLike } from '../utils/ids';
import { getRoomInventoryByName } from '../utils/room-availability';

const router = Router();

router.post('/', (req, res) => {
  const {
    guestName,
    guestEmail,
    guestPhone,
    roomType,
    checkInDate,
    checkOutDate,
    numberOfGuests,
    numberOfRooms,
    specialRequests
  } = req.body ?? {};

  if (!guestName || !guestEmail || !guestPhone || !roomType || !checkInDate || !checkOutDate || !numberOfGuests) {
    res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
    return;
  }

  const checkIn = parseDate(String(checkInDate));
  const checkOut = parseDate(String(checkOutDate));

  if (!checkIn || !checkOut || checkOut <= checkIn) {
    res.status(400).json({
      success: false,
      message: 'Check-out date must be after check-in date'
    });
    return;
  }

  const guestsRequested = Number(numberOfGuests) || 1;
  const roomsRequested = Number(numberOfRooms) || 1;
  const room = getRoomInventoryByName(listRooms(), listBookings(), String(roomType), {
    checkIn: String(checkInDate),
    checkOut: String(checkOutDate)
  });

  if (!room) {
    res.status(404).json({
      success: false,
      message: 'Room type not found'
    });
    return;
  }

  if (room.availableRooms < roomsRequested) {
    res.status(409).json({
      success: false,
      message: `Only ${room.availableRooms} ${room.availableRooms === 1 ? 'room is' : 'rooms are'} available for the selected dates.`
    });
    return;
  }

  if (guestsRequested > room.capacity * roomsRequested) {
    res.status(400).json({
      success: false,
      message: `This room selection can host up to ${room.capacity * roomsRequested} guest(s).`
    });
    return;
  }

  const nights = nightsBetween(String(checkInDate), String(checkOutDate));
  const totalPrice = room.price * nights * roomsRequested;
  const timestamp = new Date().toISOString();
  const booking: BookingRecord = {
    id: createObjectIdLike(),
    bookingId: createBookingReference(),
    guestName: String(guestName).trim(),
    guestEmail: String(guestEmail).trim().toLowerCase(),
    guestPhone: String(guestPhone).trim(),
    roomType: room.name,
    checkInDate: checkIn.toISOString(),
    checkOutDate: checkOut.toISOString(),
    numberOfGuests: guestsRequested,
    numberOfRooms: roomsRequested,
    totalPrice,
    specialRequests: String(specialRequests || '').trim(),
    status: 'pending',
    paymentStatus: 'unpaid',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  createBooking(booking);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    booking
  });
});

router.get('/', adminAuth, (_req, res) => {
  const bookings = listBookings();
  res.status(200).json({
    success: true,
    count: bookings.length,
    bookings
  });
});

router.get('/stats/dashboard', adminAuth, (_req, res) => {
  res.status(200).json({
    success: true,
    stats: getBookingStats()
  });
});

router.get('/email/:email', (req, res) => {
  const bookings = getBookingsByEmail(req.params.email);
  res.status(200).json({
    success: true,
    count: bookings.length,
    bookings
  });
});

router.get('/:id', (req, res) => {
  const booking = getBookingById(req.params.id);

  if (!booking) {
    res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    booking
  });
});

router.put('/:id', auth, (req, res) => {
  const booking = updateBooking(req.params.id, {
    status: req.body?.status ? String(req.body.status) : undefined,
    paymentStatus: req.body?.paymentStatus ? String(req.body.paymentStatus) : undefined,
    updatedAt: new Date().toISOString()
  });

  if (!booking) {
    res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Booking updated successfully',
    booking
  });
});

router.put('/:id/cancel', (req, res) => {
  const booking = updateBooking(req.params.id, {
    status: 'cancelled',
    updatedAt: new Date().toISOString()
  });

  if (!booking) {
    res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    booking
  });
});

router.delete('/:id', auth, (req, res) => {
  if (!deleteBooking(req.params.id)) {
    res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Booking deleted successfully'
  });
});

export default router;
