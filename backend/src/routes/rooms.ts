import { Router } from 'express';
import { roomCatalog } from '../data/catalog';
import {
  createRoom,
  deleteRoom,
  getBookingById,
  getRoomById,
  getRoomByName,
  listBookings,
  listRooms,
  updateRoom
} from '../lib/room-store';
import { adminAuth } from '../middleware/auth';
import { RoomRecord } from '../types/domain';
import { createObjectIdLike } from '../utils/ids';
import { getRoomInventoryByName, computeRoomInventory } from '../utils/room-availability';

const router = Router();

router.get('/', (_req, res) => {
  const rooms = listRooms();
  const bookings = listBookings();
  const inventory = computeRoomInventory(rooms, bookings, {
    checkIn: String(_req.query.checkIn || ''),
    checkOut: String(_req.query.checkOut || '')
  });

  res.status(200).json({
    success: true,
    count: inventory.length,
    rooms: inventory,
    search: {
      checkIn: _req.query.checkIn || null,
      checkOut: _req.query.checkOut || null
    }
  });
});

router.get('/name/:name', (req, res) => {
  const room = getRoomInventoryByName(listRooms(), listBookings(), decodeURIComponent(req.params.name), {
    checkIn: String(req.query.checkIn || ''),
    checkOut: String(req.query.checkOut || '')
  });

  if (!room) {
    res.status(404).json({
      success: false,
      message: 'Room type not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    room
  });
});

router.get('/:id', (req, res) => {
  const room = getRoomById(req.params.id);

  if (!room) {
    res.status(404).json({
      success: false,
      message: 'Room not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    room
  });
});

router.post('/', adminAuth, (req, res) => {
  const { name, description, price, capacity, amenities, image, totalRooms } = req.body ?? {};

  if (!name || !description || !price) {
    res.status(400).json({
      success: false,
      message: 'Please provide all required fields (name, description, price)'
    });
    return;
  }

  if (getRoomByName(String(name).trim())) {
    res.status(400).json({
      success: false,
      message: 'Room already exists with that name'
    });
    return;
  }

  const timestamp = new Date().toISOString();
  const room: RoomRecord = {
    id: createObjectIdLike(),
    name: String(name).trim(),
    description: String(description).trim(),
    price: Number(price),
    capacity: Number(capacity) || 2,
    amenities: Array.isArray(amenities) ? amenities.map(String) : [],
    image: String(image || '/images/room-standard.jpg'),
    totalRooms: Number(totalRooms) || 1,
    available: true,
    sortOrder: listRooms().length,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  createRoom(room);

  res.status(201).json({
    success: true,
    message: 'Room created successfully',
    room
  });
});

router.put('/:id', adminAuth, (req, res) => {
  const timestamp = new Date().toISOString();
  const room = updateRoom(req.params.id, {
    name: req.body?.name ? String(req.body.name).trim() : undefined,
    description: req.body?.description ? String(req.body.description).trim() : undefined,
    price: req.body?.price !== undefined ? Number(req.body.price) : undefined,
    capacity: req.body?.capacity !== undefined ? Number(req.body.capacity) : undefined,
    amenities: Array.isArray(req.body?.amenities) ? req.body.amenities.map(String) : undefined,
    image: req.body?.image ? String(req.body.image) : undefined,
    available: req.body?.available !== undefined ? Boolean(req.body.available) : undefined,
    totalRooms: req.body?.totalRooms !== undefined ? Number(req.body.totalRooms) : undefined,
    sortOrder: req.body?.sortOrder !== undefined ? Number(req.body.sortOrder) : undefined,
    updatedAt: timestamp
  });

  if (!room) {
    res.status(404).json({
      success: false,
      message: 'Room not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Room updated successfully',
    room
  });
});

router.delete('/:id', adminAuth, (req, res) => {
  if (!deleteRoom(req.params.id)) {
    res.status(404).json({
      success: false,
      message: 'Room not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Room deleted successfully'
  });
});

router.post('/init/default-rooms', adminAuth, (_req, res) => {
  if (listRooms().length > 0) {
    res.status(400).json({
      success: false,
      message: 'Default rooms already initialized'
    });
    return;
  }

  const timestamp = new Date().toISOString();
  const rooms = roomCatalog.map((seedRoom, index) =>
    createRoom({
      id: createObjectIdLike(),
      name: seedRoom.name,
      description: seedRoom.description,
      price: seedRoom.price,
      capacity: seedRoom.capacity,
      amenities: seedRoom.amenities,
      image: seedRoom.image,
      totalRooms: seedRoom.totalRooms,
      available: seedRoom.available,
      sortOrder: index,
      createdAt: timestamp,
      updatedAt: timestamp
    })
  );

  res.status(201).json({
    success: true,
    message: 'Default rooms initialized successfully',
    rooms
  });
});

export default router;
