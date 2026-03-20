import { Router } from 'express';
import { spaAddOns, spaHours, spaServiceCatalog } from '../data/catalog';
import {
  createSpaBooking,
  getSpaBookingByConfirmationCode,
  getSpaBookingsByEmail,
  getSpaDashboardStats,
  listSpaBookings,
  updateSpaBooking
} from '../lib/spa-store';
import { adminAuth, auth, AuthenticatedRequest } from '../middleware/auth';
import { SpaBookingRecord } from '../types/domain';
import { parseDate, toDisplayTime, toIsoDate } from '../utils/dates';
import { createObjectIdLike, createSpaConfirmationCode } from '../utils/ids';

const router = Router();

const serviceMap = spaServiceCatalog.reduce<Record<string, Record<string, (typeof spaServiceCatalog)[number]>>>((accumulator, service) => {
  if (!accumulator[service.serviceType]) {
    accumulator[service.serviceType] = {};
  }

  accumulator[service.serviceType][service.serviceId] = service;
  return accumulator;
}, {});

function buildTimeSlots(): string[] {
  const [openHour] = spaHours.open.split(':').map(Number);
  const [closeHour] = spaHours.close.split(':').map(Number);
  const slots: string[] = [];

  for (let hour = openHour; hour < closeHour; hour += 1) {
    slots.push(`${String(hour).padStart(2, '0')}:00`);
  }

  return slots;
}

function buildAvailability(dateValue: string, bookings: SpaBookingRecord[]) {
  const dateKey = toIsoDate(dateValue);
  const now = new Date();

  const slots = buildTimeSlots().map((time) => {
    const bookedCount = bookings
      .filter((booking) => booking.status !== 'cancelled')
      .filter((booking) => booking.appointmentDate === dateKey)
      .filter((booking) => booking.appointmentTime === time)
      .length;

    const slotDateTime = new Date(`${dateKey}T${time}:00`);
    const isPast = slotDateTime <= now;
    const remaining = Math.max(0, spaHours.maxConcurrentAppointments - bookedCount);

    return {
      time,
      label: toDisplayTime(time),
      bookedCount,
      remaining,
      isAvailable: !isPast && remaining > 0
    };
  });

  return {
    date: dateKey,
    hours: spaHours,
    nextAvailable: slots.find((slot) => slot.isAvailable) || null,
    slots
  };
}

router.get('/services', (_req, res) => {
  res.status(200).json({
    success: true,
    services: serviceMap,
    serviceList: spaServiceCatalog,
    addOns: spaAddOns,
    hours: spaHours
  });
});

router.get('/availability', (req, res) => {
  const availability = buildAvailability(String(req.query.date || toIsoDate()), listSpaBookings());
  res.status(200).json({
    success: true,
    ...availability
  });
});

router.post('/bookings', (req, res) => {
  const {
    guestName,
    guestEmail,
    guestPhone,
    serviceType,
    serviceId,
    appointmentDate,
    appointmentTime,
    therapistPreference,
    selectedAddOns,
    specialRequests,
    allergies,
    medicalConditions
  } = req.body ?? {};

  if (!guestName || !guestEmail || !guestPhone || !serviceType || !serviceId || !appointmentDate || !appointmentTime) {
    res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
    return;
  }

  const appointmentDateTime = parseDate(`${appointmentDate}T${appointmentTime}:00`);
  if (!appointmentDateTime || appointmentDateTime <= new Date()) {
    res.status(400).json({
      success: false,
      message: 'Appointment date/time must be in the future'
    });
    return;
  }

  const service = serviceMap[String(serviceType)]?.[String(serviceId)];
  if (!service) {
    res.status(404).json({
      success: false,
      message: 'Service not found'
    });
    return;
  }

  const availability = buildAvailability(String(appointmentDate), listSpaBookings());
  const selectedSlot = availability.slots.find((slot) => slot.time === String(appointmentTime));
  if (!selectedSlot || !selectedSlot.isAvailable) {
    res.status(409).json({
      success: false,
      message: 'The selected spa time slot is no longer available.'
    });
    return;
  }

  const addOns = (Array.isArray(selectedAddOns) ? selectedAddOns : [])
    .map((id) => String(id))
    .map((id) => {
      const addOn = spaAddOns[id];
      return addOn ? { id, name: addOn.name, price: addOn.price } : null;
    })
    .filter((entry): entry is { id: string; name: string; price: number } => Boolean(entry));

  const addOnsTotal = addOns.reduce((sum, addOn) => sum + addOn.price, 0);
  const timestamp = new Date().toISOString();
  const booking: SpaBookingRecord = {
    id: createObjectIdLike(),
    confirmationCode: createSpaConfirmationCode(),
    guestName: String(guestName).trim(),
    guestEmail: String(guestEmail).trim().toLowerCase(),
    guestPhone: String(guestPhone).trim(),
    serviceType: service.serviceType,
    serviceId: service.serviceId,
    serviceName: service.name,
    duration: service.duration,
    appointmentDate: toIsoDate(String(appointmentDate)),
    appointmentTime: String(appointmentTime),
    therapistPreference: String(therapistPreference || 'no-preference'),
    addOns,
    basePrice: service.basePrice,
    addOnsTotal,
    totalPrice: service.basePrice + addOnsTotal,
    specialRequests: String(specialRequests || '').trim(),
    allergies: String(allergies || '').trim(),
    medicalConditions: String(medicalConditions || '').trim(),
    status: 'pending',
    paymentStatus: 'unpaid',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  createSpaBooking(booking);

  res.status(201).json({
    success: true,
    message: 'Spa booking created successfully',
    booking
  });
});

router.get('/bookings/:confirmationCode', (req, res) => {
  const booking = getSpaBookingByConfirmationCode(req.params.confirmationCode);
  if (!booking) {
    res.status(404).json({
      success: false,
      message: 'Spa booking not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    booking
  });
});

router.get('/guest/:guestEmail', (req, res) => {
  const bookings = getSpaBookingsByEmail(req.params.guestEmail);
  res.status(200).json({
    success: true,
    count: bookings.length,
    bookings
  });
});

router.get('/admin/bookings', adminAuth, (_req, res) => {
  const bookings = listSpaBookings();
  res.status(200).json({
    success: true,
    count: bookings.length,
    bookings
  });
});

router.put('/bookings/:id/status', auth, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Only admins can update spa booking status'
    });
    return;
  }

  const booking = updateSpaBooking(req.params.id, {
    status: req.body?.status ? String(req.body.status) : undefined,
    paymentStatus: req.body?.paymentStatus ? String(req.body.paymentStatus) : undefined,
    updatedAt: new Date().toISOString()
  });

  if (!booking) {
    res.status(404).json({
      success: false,
      message: 'Spa booking not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Spa booking status updated',
    booking
  });
});

router.put('/bookings/:id/cancel', (req, res) => {
  const booking = updateSpaBooking(req.params.id, {
    status: 'cancelled',
    updatedAt: new Date().toISOString()
  });

  if (!booking) {
    res.status(404).json({
      success: false,
      message: 'Spa booking not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Spa booking cancelled successfully',
    booking
  });
});

router.get('/admin/dashboard', adminAuth, (_req: AuthenticatedRequest, res) => {
  const dashboard = getSpaDashboardStats();
  res.status(200).json({
    success: true,
    stats: {
      totalBookings: dashboard.totalBookings,
      confirmedBookings: dashboard.confirmedBookings,
      pendingBookings: dashboard.pendingBookings,
      totalRevenue: dashboard.totalRevenue
    },
    upcomingBookings: dashboard.upcomingBookings
  });
});

export default router;
