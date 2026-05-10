import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/budget/trip/:tripId
router.get('/trip/:tripId', authenticate, async (req, res) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user.id },
      include: {
        budget: true,
        stops: { include: { activities: true } },
      },
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const budget = trip.budget || {};
    const activityCost = trip.stops.reduce((sum, stop) =>
      sum + stop.activities.reduce((s, a) => s + (a.cost || 0), 0), 0
    );

    const totalDays = trip.startDate && trip.endDate
      ? Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24))
      : trip.stops.reduce((sum, s) => sum + (s.nights || 0), 0) || 1;

    const totals = {
      transportCost: budget.transportCost || 0,
      hotelCost: budget.hotelCost || 0,
      foodCost: budget.foodCost || 0,
      activityCost: budget.activityCost || activityCost,
      miscCost: budget.miscCost || 0,
    };

    totals.totalBudget = Object.values(totals).reduce((a, b) => a + b, 0);
    const dailyAverage = totals.totalBudget / totalDays;

    const breakdown = [
      { label: 'Transport', value: totals.transportCost, color: '#6366f1' },
      { label: 'Hotel', value: totals.hotelCost, color: '#8b5cf6' },
      { label: 'Food', value: totals.foodCost, color: '#ec4899' },
      { label: 'Activities', value: totals.activityCost, color: '#f59e0b' },
      { label: 'Misc', value: totals.miscCost, color: '#10b981' },
    ].filter(item => item.value > 0);

    res.json({
      ...totals,
      dailyAverage,
      totalDays,
      currency: budget.currency || trip.currency || 'USD',
      breakdown,
      id: budget.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// PUT /api/budget/trip/:tripId
router.put('/trip/:tripId', authenticate, async (req, res) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user.id },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const { transportCost, hotelCost, foodCost, activityCost, miscCost, currency } = req.body;

    const totals = {
      transportCost: parseFloat(transportCost) || 0,
      hotelCost: parseFloat(hotelCost) || 0,
      foodCost: parseFloat(foodCost) || 0,
      activityCost: parseFloat(activityCost) || 0,
      miscCost: parseFloat(miscCost) || 0,
    };

    totals.totalBudget = Object.values(totals).reduce((a, b) => a + b, 0);

    const budget = await prisma.budget.upsert({
      where: { tripId: req.params.tripId },
      update: { ...totals, ...(currency && { currency }) },
      create: { tripId: req.params.tripId, ...totals, currency: currency || 'USD' },
    });

    // Update trip total budget
    await prisma.trip.update({
      where: { id: req.params.tripId },
      data: { totalBudget: totals.totalBudget },
    });

    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

export default router;
