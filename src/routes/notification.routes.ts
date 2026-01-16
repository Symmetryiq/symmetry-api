import express, { Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Notification } from '../models/Notification.model';
import { User } from '../models/User.model';
import {
  getUnreadCount,
  sendBroadcastNotification,
  sendPushNotification,
} from '../services/notification.service';
import { AuthRequest } from '../types';

const router = express.Router();

// POST /api/notifications/register - Register/update FCM token
router.post(
  '/register',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { fcmToken } = req.body;

      if (!fcmToken) {
        return res.status(400).json({ error: 'FCM token is required' });
      }

      await User.findByIdAndUpdate(userId, { fcmToken });

      // console.log(`📱 FCM token registered for user ${userId}`);
      res.json({ success: true, message: 'Push token registered' });
    } catch (error: any) {
      console.error('Error registering token:', error);
      res.status(500).json({ error: 'Failed to register push token' });
    }
  }
);

// GET /api/notifications - Get user's notifications (paginated)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId }),
      getUnreadCount(userId),
    ]);

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread-count - Get unread count
router.get(
  '/unread-count',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as any).userId;
      const count = await getUnreadCount(userId);
      res.json({ unreadCount: count });
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  }
);

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch(
  '/:id/read',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { read: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ notification });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }
);

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch(
  '/read-all',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as any).userId;

      await Notification.updateMany({ userId, read: false }, { read: true });

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      res.status(500).json({ error: 'Failed to mark all as read' });
    }
  }
);

// POST /api/notifications/send - Send notification (admin endpoint)
// In production, add admin authentication middleware
router.post('/send', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, title, body, data, broadcast } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    if (broadcast) {
      // Send to all users
      const result = await sendBroadcastNotification({ title, body, data });
      return res.json({
        ...result,
        success: true,
        message: 'Broadcast notification sent',
      });
    }

    if (!userId) {
      return res
        .status(400)
        .json({ error: 'userId is required for targeted notifications' });
    }

    // Send to specific user
    const success = await sendPushNotification(userId, { title, body, data });

    if (success) {
      res.json({ success: true, message: 'Notification sent' });
    } else {
      res
        .status(400)
        .json({ success: false, message: 'Failed to send notification' });
    }
  } catch (error: any) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// POST /api/notifications/test - Send test notification to yourself
// Just login and call this endpoint - no userId needed
router.post('/test', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).userId;

    const success = await sendPushNotification(userId.toString(), {
      title: '🧪 Test Notification',
      body: 'If you see this, push notifications are working!',
      data: { type: 'test' },
    });

    if (success) {
      res.json({
        success: true,
        message: 'Test notification sent to your device',
      });
    } else {
      res.json({
        success: false,
        message:
          'Failed - make sure you have a registered FCM token and notifications enabled',
      });
    }
  } catch (error: any) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// POST /api/notifications/cron/daily-reminder - Daily reminder cron endpoint
// Protected by CRON_SECRET for use with Vercel Cron, GitHub Actions, etc.
router.post('/cron/daily-reminder', async (req, res: Response) => {
  try {
    // Verify cron secret (set CRON_SECRET in your environment variables)
    const cronSecret =
      req.headers['x-cron-secret'] ||
      req.headers['authorization']?.replace('Bearer ', '');

    if (cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await sendBroadcastNotification({
      title: '✨ Daily Routine Reminder',
      body: 'Time to complete your daily routine for best results!',
      data: { type: 'daily_reminder', route: '/(app)/(tabs)/(home)' },
    });

    console.log('📅 Daily reminder cron executed:', result);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Cron error:', error);
    res.status(500).json({ error: 'Failed to send daily reminders' });
  }
});

export default router;
