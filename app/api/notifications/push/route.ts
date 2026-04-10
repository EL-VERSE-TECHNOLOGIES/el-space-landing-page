import { NextRequest, NextResponse } from 'next/server';
import {
  subscribeUserToPushNotifications,
  unsubscribeUserFromPushNotifications,
  sendPushNotificationToUser,
  sendBatchPushNotifications,
  notifyJobMatch,
  notifyNewApplication,
  notifyMilestoneUpdate,
  notifyPaymentReceived,
  notifyNewMessage,
  notifyProjectCompletion,
  getVapidPublicKey,
} from '@/lib/push-notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...payload } = body;

    switch (action) {
      case 'subscribe':
        return await handleSubscribe(payload);

      case 'unsubscribe':
        return await handleUnsubscribe(payload);

      case 'send':
        return await handleSendNotification(payload);

      case 'notifyJobMatch':
        return await handleNotifyJobMatch(payload);

      case 'notifyNewApplication':
        return await handleNotifyApplication(payload);

      case 'notifyMilestone':
        return await handleNotifyMilestone(payload);

      case 'notifyPayment':
        return await handleNotifyPayment(payload);

      case 'notifyMessage':
        return await handleNotifyMessage(payload);

      case 'notifyCompletion':
        return await handleNotifyCompletion(payload);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'vapidKey') {
      return NextResponse.json({
        publicKey: getVapidPublicKey(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching VAPID key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VAPID key' },
      { status: 500 }
    );
  }
}

async function handleSubscribe(payload: any) {
  try {
    const { userId, subscription } = payload;

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: 'User ID and subscription required' },
        { status: 400 }
      );
    }

    await subscribeUserToPushNotifications(userId, subscription);

    return NextResponse.json({
      success: true,
      message: 'User subscribed to push notifications',
    }, { status: 201 });
  } catch (error) {
    console.error('Error subscribing user:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe user' },
      { status: 500 }
    );
  }
}

async function handleUnsubscribe(payload: any) {
  try {
    const { userId, endpoint } = payload;

    if (!userId || !endpoint) {
      return NextResponse.json(
        { error: 'User ID and endpoint required' },
        { status: 400 }
      );
    }

    await unsubscribeUserFromPushNotifications(userId, endpoint);

    return NextResponse.json({
      success: true,
      message: 'User unsubscribed from push notifications',
    });
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe user' },
      { status: 500 }
    );
  }
}

async function handleSendNotification(payload: any) {
  try {
    const { userId, notification, userIds } = payload;

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification required' },
        { status: 400 }
      );
    }

    if (userId) {
      await sendPushNotificationToUser(userId, notification);
    } else if (userIds && Array.isArray(userIds)) {
      await sendBatchPushNotifications(userIds, notification);
    } else {
      return NextResponse.json(
        { error: 'User ID or User IDs array required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent',
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

async function handleNotifyJobMatch(payload: any) {
  try {
    const { userId, jobTitle, clientName } = payload;

    if (!userId || !jobTitle || !clientName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await notifyJobMatch(userId, jobTitle, clientName);

    return NextResponse.json({
      success: true,
      message: 'Job match notification sent',
    });
  } catch (error) {
    console.error('Error sending job match notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

async function handleNotifyApplication(payload: any) {
  try {
    const { userId, freelancerName, jobTitle } = payload;

    if (!userId || !freelancerName || !jobTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await notifyNewApplication(userId, freelancerName, jobTitle);

    return NextResponse.json({
      success: true,
      message: 'Application notification sent',
    });
  } catch (error) {
    console.error('Error sending application notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

async function handleNotifyMilestone(payload: any) {
  try {
    const { userId, projectTitle, status } = payload;

    if (!userId || !projectTitle || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await notifyMilestoneUpdate(userId, projectTitle, status);

    return NextResponse.json({
      success: true,
      message: 'Milestone notification sent',
    });
  } catch (error) {
    console.error('Error sending milestone notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

async function handleNotifyPayment(payload: any) {
  try {
    const { userId, projectTitle, amount } = payload;

    if (!userId || !projectTitle || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await notifyPaymentReceived(userId, projectTitle, amount);

    return NextResponse.json({
      success: true,
      message: 'Payment notification sent',
    });
  } catch (error) {
    console.error('Error sending payment notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

async function handleNotifyMessage(payload: any) {
  try {
    const { userId, senderName, message } = payload;

    if (!userId || !senderName || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await notifyNewMessage(userId, senderName, message);

    return NextResponse.json({
      success: true,
      message: 'Message notification sent',
    });
  } catch (error) {
    console.error('Error sending message notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

async function handleNotifyCompletion(payload: any) {
  try {
    const { userId, projectTitle } = payload;

    if (!userId || !projectTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await notifyProjectCompletion(userId, projectTitle);

    return NextResponse.json({
      success: true,
      message: 'Completion notification sent',
    });
  } catch (error) {
    console.error('Error sending completion notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
