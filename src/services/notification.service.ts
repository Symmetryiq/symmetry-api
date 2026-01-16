import admin from 'firebase-admin';
import { Notification } from '../models/Notification.model';
import { User } from '../models/User.model';

interface SendNotificationOptions {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send a push notification to a specific user
 */
export const sendPushNotification = async (
  userId: string,
  options: SendNotificationOptions
): Promise<boolean> => {
  try {
    const user = await User.findById(userId);

    if (!user?.fcmToken || !user.notificationsEnabled) {
      console.log(`User ${userId} has no FCM token or notifications disabled`);
      return false;
    }

    // Store notification in database
    await Notification.create({
      userId: user._id,
      title: options.title,
      body: options.body,
      data: options.data || {},
    });

    // Send via FCM
    const message: admin.messaging.Message = {
      token: user.fcmToken,
      notification: {
        title: options.title,
        body: options.body,
      },
      data: options.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent:', response);
    return true;
  } catch (error: any) {
    console.error('❌ Error sending notification:', error.message);

    // Handle invalid token - clear it from user
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      await User.findByIdAndUpdate(userId, { fcmToken: null });
    }

    return false;
  }
};

/**
 * Send a push notification to all users with valid FCM tokens
 */
export const sendBroadcastNotification = async (
  options: SendNotificationOptions
): Promise<{ success: number; failed: number }> => {
  const users = await User.find({
    fcmToken: { $ne: null },
    notificationsEnabled: true,
  }).select('_id fcmToken');

  let success = 0;
  let failed = 0;

  for (const user of users) {
    // Store notification for each user
    await Notification.create({
      userId: user._id,
      title: options.title,
      body: options.body,
      data: options.data || {},
    });

    try {
      const message: admin.messaging.Message = {
        token: user.fcmToken!,
        notification: {
          title: options.title,
          body: options.body,
        },
        data: options.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      await admin.messaging().send(message);
      success++;
    } catch (error) {
      failed++;
    }
  }

  console.log(`📢 Broadcast sent: ${success} success, ${failed} failed`);
  return { success, failed };
};

/**
 * Send daily reminder notifications to all users
 * This can be called by a cron job or scheduled task
 */
export const sendDailyReminders = async (): Promise<void> => {
  await sendBroadcastNotification({
    title: '✨ Daily Routine Reminder',
    body: "Don't forget to complete your daily routine for best results!",
    data: { type: 'daily_reminder' },
  });
};

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  return Notification.countDocuments({ userId, read: false });
};
