import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notes/trip/:tripId
router.get('/trip/:tripId', authenticate, async (req, res) => {
  try {
    const trip = await prisma.trip.findFirst({ where: { id: req.params.tripId, userId: req.user.id } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const notes = await prisma.note.findMany({
      where: { tripId: req.params.tripId, userId: req.user.id },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST /api/notes
router.post('/', authenticate, async (req, res) => {
  try {
    const { tripId, title, content, type, day } = req.body;
    if (!tripId || !content) return res.status(400).json({ error: 'tripId and content are required' });

    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId: req.user.id } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const note = await prisma.note.create({
      data: {
        tripId, userId: req.user.id, title, content,
        type: type || 'GENERAL',
        day: day ? parseInt(day) : null,
      },
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT /api/notes/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const note = await prisma.note.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const { title, content, type, day, isPinned } = req.body;
    const updated = await prisma.note.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content && { content }),
        ...(type && { type }),
        ...(day !== undefined && { day: day ? parseInt(day) : null }),
        ...(isPinned !== undefined && { isPinned }),
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const note = await prisma.note.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    await prisma.note.delete({ where: { id: req.params.id } });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
