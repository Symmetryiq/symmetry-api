import express, { Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { AuthRequest } from '../types';

const router = express.Router();

// GET /api/user/profile - Get current user profile
router.get(
  '/profile',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as any).userId;
      const user = await User.findById(userId).select('-__v');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
);

// PUT /api/user/profile - Update user profile
router.put(
  '/profile',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { name, age, gender } = req.body;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (age !== undefined) updates.age = age;
      if (gender !== undefined) updates.gender = gender;

      const user = await User.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true,
      }).select('-__v');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true, user });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// PATCH /api/user/notifications - Toggle notifications
router.patch(
  '/notifications',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { enabled } = req.body;

      if (enabled === undefined) {
        return res.status(400).json({ error: 'enabled (boolean) is required' });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { notificationsEnabled: enabled },
        { new: true }
      ).select('notificationsEnabled');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        message: `Notifications ${enabled ? 'enabled' : 'disabled'}`,
        notificationsEnabled: user.notificationsEnabled,
      });
    } catch (error: any) {
      console.error('Error toggling notifications:', error);
      res.status(500).json({ error: 'Failed to update notification settings' });
    }
  }
);

export default router;
