import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, query, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// GET /api/trips — Get user's trips
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search, sort = 'updatedAt', order = 'desc' } = req.query;

    const where = {
      userId: req.user.id,
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const trips = await prisma.trip.findMany({
      where,
      include: {
        stops: {
          include: { _count: { select: { activities: true } } },
          orderBy: { order: 'asc' },
        },
        budget: true,
        _count: { select: { notes: true } },
      },
      orderBy: { [sort]: order },
    });

    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// GET /api/trips/upcoming
router.get('/upcoming', authenticate, async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        userId: req.user.id,
        status: { in: ['UPCOMING', 'PLANNING'] },
        startDate: { gte: new Date() },
      },
      include: {
        stops: { orderBy: { order: 'asc' }, take: 3 },
        budget: true,
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch upcoming trips' });
  }
});

// GET /api/trips/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        stops: {
          include: {
            activities: { orderBy: { order: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
        budget: true,
        notes: { orderBy: { createdAt: 'desc' } },
        packingList: { include: { items: true } },
      },
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// GET /api/trips/share/:token — Public trip view
router.get('/share/:token', optionalAuth, async (req, res) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { shareToken: req.params.token, isPublic: true },
      include: {
        user: { select: { name: true, avatar: true } },
        stops: {
          include: { activities: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
        budget: true,
      },
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found or not public' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shared trip' });
  }
});

// POST /api/trips
router.post('/', authenticate, upload.single('coverImage'), async (req, res) => {
  try {
    const { title, description, startDate, endDate, travelerCount, currency } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const coverImage = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.coverImageUrl || null;

    const trip = await prisma.trip.create({
      data: {
        userId: req.user.id,
        title,
        description,
        coverImage,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        travelerCount: parseInt(travelerCount) || 1,
        currency: currency || 'USD',
      },
      include: { stops: true, budget: true },
    });

    // Auto-create budget
    await prisma.budget.create({
      data: { tripId: trip.id, currency: currency || 'USD' },
    });

    // Auto-create packing list
    await prisma.packingList.create({
      data: { tripId: trip.id, userId: req.user.id },
    });

    res.status(201).json(trip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// PUT /api/trips/:id
router.put('/:id', authenticate, upload.single('coverImage'), async (req, res) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const { title, description, startDate, endDate, travelerCount, status, currency, coverImageUrl } = req.body;

    const coverImage = req.file
      ? `/uploads/${req.file.filename}`
      : coverImageUrl || trip.coverImage;

    const updated = await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        coverImage,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(travelerCount && { travelerCount: parseInt(travelerCount) }),
        ...(status && { status }),
        ...(currency && { currency }),
      },
      include: { stops: true, budget: true },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// DELETE /api/trips/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    await prisma.trip.delete({ where: { id: req.params.id } });
    res.json({ message: 'Trip deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

// POST /api/trips/:id/share — Generate public share link
router.post('/:id/share', authenticate, async (req, res) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const shareToken = trip.shareToken || uuidv4();
    const updated = await prisma.trip.update({
      where: { id: req.params.id },
      data: { isPublic: true, shareToken },
    });

    const shareUrl = `${process.env.FRONTEND_URL}/shared/${shareToken}`;
    res.json({ shareUrl, shareToken, trip: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// DELETE /api/trips/:id/share — Revoke share link
router.delete('/:id/share', authenticate, async (req, res) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    await prisma.trip.update({
      where: { id: req.params.id },
      data: { isPublic: false, shareToken: null },
    });

    res.json({ message: 'Share link revoked' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke share link' });
  }
});

export default router;
