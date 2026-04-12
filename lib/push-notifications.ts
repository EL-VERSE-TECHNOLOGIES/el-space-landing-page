import webpush from 'web-push';
import { supabase } from './supabase';

// Configure web push - only if keys are available and valid
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Helper function to check if key is valid base64
const isValidBase64 = (str: string): boolean => {
  if (!str) return false;
  try {
    return Buffer.from(str, 'base64').length > 0;
  } catch {
    return false;
  }
};

// Only set VAPID details if we have valid keys
if (vapidPrivateKey && vapidPublicKey && isValidBase64(vapidPrivateKey) && isValidBase64(vapidPublicKey)) {
  try {
    webpush.setVapidDetails(
      `mailto:${process.env.EMAIL_USER}`,
      vapidPublicKey,
      vapidPrivateKey
    );
  } catch (error) {
    console.warn('Invalid VAPID keys provided, push notifications will be disabled:', error);
  }
}

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

export interface UserSubscription {
  endpoint: string;
  auth: string;
  p256dh: string;
}

/**
 * Subscribe a user to push notifications
 */
export async function subscribeUserToPushNotifications(
  userId: string,
  subscription: UserSubscription
): Promise<void> {
  try {
    await supabase
      .from('push_subscriptions')
      .upsert([{
        user_id: userId,
        endpoint: subscription.endpoint,
        auth: subscription.auth,
        p256dh: subscription.p256dh,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }], {
        onConflict: 'user_id,endpoint'
      });
  } catch (error) {
    console.error('Error subscribing user to push notifications:', error);
    throw error;
  }
}

/**
 * Unsubscribe a user from push notifications
 */
export async function unsubscribeUserFromPushNotifications(
  userId: string,
  endpoint: string
): Promise<void> {
  try {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);
  } catch (error) {
    console.error('Error unsubscribing user from push notifications:', error);
    throw error;
  }
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotificationToUser(
  userId: string,
  notification: PushNotification
): Promise<void> {
  try {
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error || !subscriptions) {
      console.warn('No push subscriptions found for user:', userId);
      return;
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge || '/badge-72x72.png',
      tag: notification.tag || 'el-space-notification',
      data: notification.data || {},
      timestamp: Date.now(),
    });

    const sendPromises = subscriptions.map(async (subscription: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh,
            },
          },
          payload
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription has been removed or expired
          await unsubscribeUserFromPushNotifications(userId, subscription.endpoint);
        } else {
          console.error('Error sending push notification:', err);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Error sending push notification to user:', error);
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendBatchPushNotifications(
  userIds: string[],
  notification: PushNotification
): Promise<void> {
  const promises = userIds.map(userId => 
    sendPushNotificationToUser(userId, notification).catch(err => 
      console.error(`Failed to send notification to user ${userId}:`, err)
    )
  );

  await Promise.all(promises);
}

/**
 * Notify user of new job match
 */
export async function notifyJobMatch(
  userId: string,
  jobTitle: string,
  clientName: string
): Promise<void> {
  await sendPushNotificationToUser(userId, {
    title: 'New Job Match! 🎯',
    body: `"${jobTitle}" - Check out this opportunity from ${clientName}`,
    tag: 'job-match',
    data: {
      type: 'job_match',
      timestamp: Date.now(),
    },
  });
}

/**
 * Notify user of new application
 */
export async function notifyNewApplication(
  userId: string,
  freelancerName: string,
  jobTitle: string
): Promise<void> {
  await sendPushNotificationToUser(userId, {
    title: 'New Application 📝',
    body: `${freelancerName} applied to "${jobTitle}"`,
    tag: 'new-application',
    data: {
      type: 'new_application',
      timestamp: Date.now(),
    },
  });
}

/**
 * Notify user of milestone update
 */
export async function notifyMilestoneUpdate(
  userId: string,
  projectTitle: string,
  status: string
): Promise<void> {
  await sendPushNotificationToUser(userId, {
    title: `Milestone ${status} 📊`,
    body: `Update on "${projectTitle}" milestone`,
    tag: 'milestone-update',
    data: {
      type: 'milestone_update',
      status,
      timestamp: Date.now(),
    },
  });
}

/**
 * Notify user of payment received
 */
export async function notifyPaymentReceived(
  userId: string,
  projectTitle: string,
  amount: number
): Promise<void> {
  await sendPushNotificationToUser(userId, {
    title: 'Payment Received 💰',
    body: `$${amount.toFixed(2)} received for "${projectTitle}"`,
    tag: 'payment-received',
    data: {
      type: 'payment_received',
      amount,
      timestamp: Date.now(),
    },
  });
}

/**
 * Notify user of new message
 */
export async function notifyNewMessage(
  userId: string,
  senderName: string,
  message: string
): Promise<void> {
  await sendPushNotificationToUser(userId, {
    title: `New Message from ${senderName} 💬`,
    body: message.substring(0, 100),
    tag: 'new-message',
    data: {
      type: 'new_message',
      timestamp: Date.now(),
    },
  });
}

/**
 * Notify user of project completion
 */
export async function notifyProjectCompletion(
  userId: string,
  projectTitle: string
): Promise<void> {
  await sendPushNotificationToUser(userId, {
    title: 'Project Completed! 🎉',
    body: `"${projectTitle}" has been completed. Leave a review!`,
    tag: 'project-completion',
    data: {
      type: 'project_completion',
      timestamp: Date.now(),
    },
  });
}

/**
 * Get VAPID public key for service worker registration
 */
export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
}
