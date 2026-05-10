import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/stops/trip/:tripId
router.get('/trip/:tripId', authenticate, async (req, res) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user.id },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const stops = await prisma.stop.findMany({
      where: { tripId: req.params.tripId },
      include: {
        activities: { orderBy: { order: 'asc' } },
        _count: { select: { activities: true } },
      },
      orderBy: { order: 'asc' },
    });

    res.json(stops);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stops' });
  }
});

// POST /api/stops — Add a stop to a trip
router.post('/', authenticate, async (req, res) => {
  try {
    const { tripId, cityName, country, latitude, longitude, arrivalDate, departureDate, nights, notes } = req.body;

    if (!tripId || !cityName || !country) {
      return res.status(400).json({ error: 'tripId, cityName, and country are required' });
    }

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId: req.user.id },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // Get next order
    const lastStop = await prisma.stop.findFirst({
      where: { tripId },
      orderBy: { order: 'desc' },
    });
    const order = (lastStop?.order ?? -1) + 1;

    const stop = await prisma.stop.create({
      data: {
        tripId,
        cityName,
        country,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
        departureDate: departureDate ? new Date(departureDate) : null,
        nights: parseInt(nights) || 1,
        notes,
        order,
      },
      include: { activities: true },
    });

    res.status(201).json(stop);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add stop' });
  }
});

// PUT /api/stops/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const stop = await prisma.stop.findFirst({
      where: { id: req.params.id },
      include: { trip: true },
    });

    if (!stop || stop.trip.userId !== req.user.id) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    const { cityName, country, arrivalDate, departureDate, nights, notes, latitude, longitude } = req.body;

    const updated = await prisma.stop.update({
      where: { id: req.params.id },
      data: {
        ...(cityName && { cityName }),
        ...(country && { country }),
        ...(arrivalDate && { arrivalDate: new Date(arrivalDate) }),
        ...(departureDate && { departureDate: new Date(departureDate) }),
        ...(nights !== undefined && { nights: parseInt(nights) }),
        ...(notes !== undefined && { notes }),
        ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
        ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
      },
      include: { activities: true },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stop' });
  }
});

// DELETE /api/stops/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const stop = await prisma.stop.findFirst({
      where: { id: req.params.id },
      include: { trip: true },
    });

    if (!stop || stop.trip.userId !== req.user.id) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    await prisma.stop.delete({ where: { id: req.params.id } });

    // Reorder remaining stops
    const remaining = await prisma.stop.findMany({
      where: { tripId: stop.tripId },
      orderBy: { order: 'asc' },
    });

    for (let i = 0; i < remaining.length; i++) {
      await prisma.stop.update({ where: { id: remaining[i].id }, data: { order: i } });
    }

    res.json({ message: 'Stop deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete stop' });
  }
});

// PUT /api/stops/reorder — Reorder stops via drag-and-drop
router.put('/reorder/:tripId', authenticate, async (req, res) => {
  try {
    const { stopIds } = req.body; // Array of stop IDs in new order

    if (!Array.isArray(stopIds)) {
      return res.status(400).json({ error: 'stopIds must be an array' });
    }

    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user.id },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    await Promise.all(
      stopIds.map((id, index) =>
        prisma.stop.update({ where: { id }, data: { order: index } })
      )
    );

    const stops = await prisma.stop.findMany({
      where: { tripId: req.params.tripId },
      include: { activities: true },
      orderBy: { order: 'asc' },
    });

    res.json(stops);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder stops' });
  }
});

export default router;
