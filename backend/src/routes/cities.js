import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// GET /api/cities/search
router.get('/search', async (req, res) => {
  try {
    const { q = '', continent, minRating, maxCost } = req.query;

    const cities = await prisma.city.findMany({
      where: {
        OR: q ? [
          { name: { contains: q, mode: 'insensitive' } },
          { country: { contains: q, mode: 'insensitive' } },
          { continent: { contains: q, mode: 'insensitive' } },
        ] : undefined,
        ...(continent && { continent: { contains: continent, mode: 'insensitive' } }),
        ...(minRating && { rating: { gte: parseFloat(minRating) } }),
        ...(maxCost && { costIndex: { lte: parseFloat(maxCost) } }),
      },
      orderBy: { popularity: 'desc' },
      take: 20,
    });

    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search cities' });
  }
});

// GET /api/cities/popular
router.get('/popular', async (req, res) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { popularity: 'desc' },
      take: 8,
    });
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch popular cities' });
  }
});

// GET /api/cities/:id
router.get('/:id', async (req, res) => {
  try {
    const city = await prisma.city.findUnique({ where: { id: req.params.id } });
    if (!city) return res.status(404).json({ error: 'City not found' });
    res.json(city);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch city' });
  }
});

export default router;
