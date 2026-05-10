import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/packing/trip/:tripId
router.get('/trip/:tripId', authenticate, async (req, res) => {
  try {
    const trip = await prisma.trip.findFirst({ where: { id: req.params.tripId, userId: req.user.id } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    let list = await prisma.packingList.findFirst({
      where: { tripId: req.params.tripId },
      include: { items: { orderBy: { category: 'asc' } } },
    });

    if (!list) {
      list = await prisma.packingList.create({
        data: { tripId: req.params.tripId, userId: req.user.id },
        include: { items: true },
      });
    }

    // Group by category
    const grouped = list.items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({ ...list, grouped });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch packing list' });
  }
});

// POST /api/packing/item — Add item
router.post('/item', authenticate, async (req, res) => {
  try {
    const { tripId, name, category, quantity } = req.body;
    if (!tripId || !name) return res.status(400).json({ error: 'tripId and name are required' });

    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId: req.user.id } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    let list = await prisma.packingList.findFirst({ where: { tripId } });
    if (!list) {
      list = await prisma.packingList.create({ data: { tripId, userId: req.user.id } });
    }

    const item = await prisma.packingItem.create({
      data: {
        packingListId: list.id,
        name,
        category: category || 'OTHER',
        quantity: parseInt(quantity) || 1,
      },
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// PUT /api/packing/item/:id — Toggle packed status or update
router.put('/item/:id', authenticate, async (req, res) => {
  try {
    const { name, isPacked, category, quantity } = req.body;
    const updated = await prisma.packingItem.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(isPacked !== undefined && { isPacked }),
        ...(category && { category }),
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/packing/item/:id
router.delete('/item/:id', authenticate, async (req, res) => {
  try {
    await prisma.packingItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// PUT /api/packing/reset/:tripId — Mark all as unpacked
router.put('/reset/:tripId', authenticate, async (req, res) => {
  try {
    const list = await prisma.packingList.findFirst({ where: { tripId: req.params.tripId } });
    if (!list) return res.status(404).json({ error: 'Packing list not found' });

    await prisma.packingItem.updateMany({
      where: { packingListId: list.id },
      data: { isPacked: false },
    });
    res.json({ message: 'Checklist reset' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset checklist' });
  }
});

export default router;
