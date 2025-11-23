import { messaging, getToken, onMessage } from '../firebase';

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    // Check if messaging is available
    if (!messaging) {
      console.log('Firebase Messaging is not supported');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      
      if (token) {
        console.log('FCM Token:', token);
        // Store token in localStorage for admin
        localStorage.setItem('fcm_token', token);
        return token;
      } else {
        console.log('No registration token available');
        return null;
      }
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) {
    console.log('Firebase Messaging is not supported');
    return;
  }

  return onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    callback(payload);
    
    // Show browser notification
    if (payload.notification) {
      new Notification(payload.notification.title || 'New Notification', {
        body: payload.notification.body || '',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'wisania-notification',
        requireInteraction: true
      });
    }
  });
};

// Show a local notification
export const showNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'wisania-notification',
      requireInteraction: true
    });
  }
};

// Save FCM token to Firestore (for sending notifications from backend)
export const saveFCMToken = async (token: string, userId: string) => {
  try {
    // This would typically save to Firestore
    // You can implement this based on your needs
    console.log('Saving FCM token for user:', userId);
    localStorage.setItem(`fcm_token_${userId}`, token);
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};
