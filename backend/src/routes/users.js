import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// GET /api/users/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        savedDestinations: true,
        _count: { select: { trips: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, resetToken, resetExpires, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/users/profile
router.put('/profile', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    const { name, bio, language } = req.body;
    const avatar = req.file ? `/uploads/${req.file.filename}` : req.body.avatarUrl;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(language && { language }),
        ...(avatar && { avatar }),
      },
    });

    const { password, resetToken, resetExpires, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/users/change-password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// POST /api/users/saved-destinations
router.post('/saved-destinations', authenticate, async (req, res) => {
  try {
    const { cityName, country, imageUrl } = req.body;
    if (!cityName || !country) return res.status(400).json({ error: 'City name and country are required' });

    // Check if already saved
    const existing = await prisma.savedDestination.findFirst({
      where: { userId: req.user.id, cityName, country },
    });
    if (existing) return res.status(409).json({ error: 'Destination already saved' });

    const saved = await prisma.savedDestination.create({
      data: { userId: req.user.id, cityName, country, imageUrl },
    });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save destination' });
  }
});

// DELETE /api/users/saved-destinations/:id
router.delete('/saved-destinations/:id', authenticate, async (req, res) => {
  try {
    await prisma.savedDestination.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    res.json({ message: 'Destination removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove destination' });
  }
});

// DELETE /api/users/account
router.delete('/account', authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect password' });

    await prisma.user.delete({ where: { id: req.user.id } });
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
