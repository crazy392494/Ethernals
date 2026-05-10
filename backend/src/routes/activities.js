import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Mock activity database
const mockActivities = [
  { id: 'a1', name: 'Eiffel Tower Visit', description: 'Iconic iron tower with city views', category: 'SIGHTSEEING', duration: 120, cost: 28, rating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=400', city: 'Paris', country: 'France' },
  { id: 'a2', name: 'Louvre Museum', description: 'World-famous art museum', category: 'CULTURE', duration: 180, cost: 17, rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1565099824688-60c97ab63f70?w=400', city: 'Paris', country: 'France' },
  { id: 'a3', name: 'Seine River Cruise', description: 'Scenic boat tour', category: 'SIGHTSEEING', duration: 60, cost: 15, rating: 4.6, imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400', city: 'Paris', country: 'France' },
  { id: 'a4', name: 'Colosseum Tour', description: 'Ancient Roman amphitheatre', category: 'CULTURE', duration: 150, cost: 22, rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400', city: 'Rome', country: 'Italy' },
  { id: 'a5', name: 'Sagrada Família', description: 'Gaudí basilica masterpiece', category: 'CULTURE', duration: 120, cost: 33, rating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400', city: 'Barcelona', country: 'Spain' },
  { id: 'a6', name: 'Tokyo Street Food Tour', description: 'Explore Shinjuku food stalls', category: 'FOOD', duration: 180, cost: 55, rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400', city: 'Tokyo', country: 'Japan' },
  { id: 'a7', name: 'Mount Fuji Day Trip', description: 'Scenic volcano hike', category: 'ADVENTURE', duration: 480, cost: 80, rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400', city: 'Tokyo', country: 'Japan' },
  { id: 'a8', name: 'Ubud Rice Terraces', description: 'Stunning rice field walks', category: 'NATURE', duration: 240, cost: 20, rating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400', city: 'Bali', country: 'Indonesia' },
  { id: 'a9', name: 'Bali Sunset Dinner', description: 'Cliffside dinner at Jimbaran', category: 'FOOD', duration: 150, cost: 45, rating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', city: 'Bali', country: 'Indonesia' },
  { id: 'a10', name: 'Ibiza Beach Club', description: 'Famous beach club experience', category: 'NIGHTLIFE', duration: 360, cost: 100, rating: 4.5, imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', city: 'Barcelona', country: 'Spain' },
  { id: 'a11', name: 'Burj Khalifa Visit', description: 'World\'s tallest building', category: 'SIGHTSEEING', duration: 90, cost: 40, rating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400', city: 'Dubai', country: 'UAE' },
  { id: 'a12', name: 'Desert Safari', description: 'Dune bashing and BBQ', category: 'ADVENTURE', duration: 360, cost: 95, rating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1519053054369-68602a2e8ce0?w=400', city: 'Dubai', country: 'UAE' },
  { id: 'a13', name: 'Sydney Opera House Tour', description: 'Iconic performing arts venue', category: 'CULTURE', duration: 90, cost: 42, rating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400', city: 'Sydney', country: 'Australia' },
  { id: 'a14', name: 'Santorini Sunset Cruise', description: 'Caldera cruise at sunset', category: 'SIGHTSEEING', duration: 180, cost: 85, rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400', city: 'Santorini', country: 'Greece' },
  { id: 'a15', name: 'Kyoto Temple Hopping', description: 'Visit Fushimi Inari & Kinkaku-ji', category: 'CULTURE', duration: 300, cost: 15, rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400', city: 'Kyoto', country: 'Japan' },
  { id: 'a16', name: 'Central Park Jog', description: 'Morning run in Central Park', category: 'NATURE', duration: 60, cost: 0, rating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400', city: 'New York', country: 'USA' },
  { id: 'a17', name: 'Broadway Show', description: 'World-class theatre performance', category: 'CULTURE', duration: 180, cost: 150, rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1518235506717-e1ed3306a89b?w=400', city: 'New York', country: 'USA' },
  { id: 'a18', name: 'Maldives Snorkeling', description: 'Coral reef exploration', category: 'ADVENTURE', duration: 120, cost: 65, rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=400', city: 'Maldives', country: 'Maldives' },
];

// GET /api/activities/search
router.get('/search', async (req, res) => {
  try {
    const { q = '', category, city, country, maxCost, minRating } = req.query;

    let results = mockActivities.filter(a => {
      const matchQ = !q || a.name.toLowerCase().includes(q.toLowerCase()) || a.description.toLowerCase().includes(q.toLowerCase());
      const matchCategory = !category || a.category === category.toUpperCase();
      const matchCity = !city || a.city.toLowerCase().includes(city.toLowerCase());
      const matchCountry = !country || a.country.toLowerCase().includes(country.toLowerCase());
      const matchCost = !maxCost || a.cost <= parseFloat(maxCost);
      const matchRating = !minRating || a.rating >= parseFloat(minRating);
      return matchQ && matchCategory && matchCity && matchCountry && matchCost && matchRating;
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search activities' });
  }
});

// GET /api/activities/stop/:stopId — Activities for a stop
router.get('/stop/:stopId', authenticate, async (req, res) => {
  try {
    const stop = await prisma.stop.findFirst({
      where: { id: req.params.stopId },
      include: { trip: true },
    });

    if (!stop || stop.trip.userId !== req.user.id) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    const activities = await prisma.activity.findMany({
      where: { stopId: req.params.stopId },
      orderBy: { order: 'asc' },
    });

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// POST /api/activities — Add activity to a stop
router.post('/', authenticate, async (req, res) => {
  try {
    const { stopId, name, description, category, duration, cost, imageUrl, address, date, timeOfDay } = req.body;

    if (!stopId || !name) {
      return res.status(400).json({ error: 'stopId and name are required' });
    }

    const stop = await prisma.stop.findFirst({
      where: { id: stopId },
      include: { trip: true },
    });

    if (!stop || stop.trip.userId !== req.user.id) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    const lastActivity = await prisma.activity.findFirst({
      where: { stopId },
      orderBy: { order: 'desc' },
    });
    const order = (lastActivity?.order ?? -1) + 1;

    const activity = await prisma.activity.create({
      data: {
        stopId,
        name,
        description,
        category: category || 'SIGHTSEEING',
        duration: duration ? parseInt(duration) : null,
        cost: cost ? parseFloat(cost) : 0,
        imageUrl,
        address,
        date: date ? new Date(date) : null,
        timeOfDay,
        order,
      },
    });

    // Recalculate budget
    await recalculateBudget(stop.tripId);

    res.status(201).json(activity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

// PUT /api/activities/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const activity = await prisma.activity.findFirst({
      where: { id: req.params.id },
      include: { stop: { include: { trip: true } } },
    });

    if (!activity || activity.stop.trip.userId !== req.user.id) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const { name, description, category, duration, cost, imageUrl, address, date, timeOfDay } = req.body;

    const updated = await prisma.activity.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(cost !== undefined && { cost: parseFloat(cost) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(address !== undefined && { address }),
        ...(date && { date: new Date(date) }),
        ...(timeOfDay !== undefined && { timeOfDay }),
      },
    });

    await recalculateBudget(activity.stop.tripId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// DELETE /api/activities/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const activity = await prisma.activity.findFirst({
      where: { id: req.params.id },
      include: { stop: { include: { trip: true } } },
    });

    if (!activity || activity.stop.trip.userId !== req.user.id) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const tripId = activity.stop.tripId;
    await prisma.activity.delete({ where: { id: req.params.id } });
    await recalculateBudget(tripId);

    res.json({ message: 'Activity deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

async function recalculateBudget(tripId) {
  const activities = await prisma.activity.findMany({
    where: { stop: { tripId } },
  });
  const activityCost = activities.reduce((sum, a) => sum + (a.cost || 0), 0);

  await prisma.budget.upsert({
    where: { tripId },
    update: { activityCost },
    create: { tripId, activityCost },
  });
}

export default router;
