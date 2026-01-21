import { clerkClient, getAuth, requireAuth } from '@clerk/express';
import express from 'express';

const router = express.Router();

// GET /api/user/profile - Get current user profile
router.get('/profile', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await clerkClient.users.getUser(userId);

    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/user/profile - Update user profile
router.patch('/profile', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { age, gender, notifications } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        gender,
        age,
        preferences: {
          notifications,
        },
      },
    });

    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
