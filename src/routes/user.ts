import { clerkClient, getAuth, requireAuth } from '@clerk/express';
import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async-handler';
import { validate } from '../middleware/validate';

const router = express.Router();

const updateProfileSchema = z.object({
  body: z.object({
    age: z.string().optional(),
    gender: z.string().optional(),
    notifications: z.boolean().optional(),
  }),
});

// GET /api/user/profile - Get current user profile
router.get(
  '/profile',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await clerkClient.users.getUser(userId);

    res.json({ success: true, user });
  })
);

// PATCH /api/user/profile - Update user profile metadata
router.patch(
  '/profile',
  requireAuth(),
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { age, gender, notifications } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...(gender !== undefined && { gender }),
        ...(age !== undefined && { age }),
        preferences: {
          ...(notifications !== undefined && { notifications }),
        },
      },
    });

    res.json({ success: true, user });
  })
);

export default router;
