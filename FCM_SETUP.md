# Firebase Cloud Messaging (FCM) Setup Guide

## 🔔 Admin Order Notifications Setup

This guide will help you enable push notifications for the admin when new orders are placed.

---

## Prerequisites

- Firebase project set up
- Admin user authenticated in the app
- Modern browser with notification support (Chrome, Firefox, Edge, Safari)

---

## Step 1: Enable Firebase Cloud Messaging

### 1.1 Enable FCM in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (⚙️ icon) → **Cloud Messaging** tab
4. Copy the **Server Key** (you'll need this for backend notifications)

### 1.2 Generate Web Push Certificate (VAPID Key)

1. In the **Cloud Messaging** tab, scroll to **Web Push certificates**
2. Click **Generate key pair**
3. Copy the **Key pair** value (starts with `B...`)
4. Add this to your `.env` file:

```env
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

---

## Step 2: Update Service Worker Config

### 2.1 Edit `public/firebase-messaging-sw.js`

Replace the placeholder config with your actual Firebase config:

```javascript
firebase.initializeApp({
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});
```

---

## Step 3: Test Notifications

### 3.1 Enable Notifications in Admin Panel

1. Log in to admin dashboard
2. Look for the **Bell icon** (🔔) in the top navigation
3. Click it to enable notifications
4. Browser will prompt for permission - click **Allow**
5. The bell icon will turn green when notifications are enabled

### 3.2 Test Order Notifications

**Method 1: Automatic Detection (Recommended)**
- The system checks for new orders every 30 seconds
- When a new order is placed, admin receives a notification
- Notification shows count of new orders

**Method 2: Test via Firebase Console**
1. Go to Firebase Console → **Cloud Messaging**
2. Click **Send your first message**
3. Fill in:
   - **Notification title**: "New Order!"
   - **Notification text**: "You have a new order"
4. Click **Send test message**
5. Paste your FCM token (check browser console for token)
6. Click **Test** button

---

## Step 4: Environment Variables

Ensure your `.env` file has all required variables:

```env
# Firebase Config
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# FCM Web Push
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

---

## Features Implemented

### ✅ Real-time Order Monitoring
- Checks for new orders every 30 seconds
- Only monitors when admin is on the Orders tab
- Automatically shows notification count

### ✅ Browser Notifications
- Desktop notifications with sound
- Shows order count and details
- Click notification to open dashboard
- Works even when tab is in background

### ✅ Notification Controls
- Toggle button in admin header
- Green bell (🔔) = Enabled
- Gray bell (🔕) = Disabled
- Persists notification preference

### ✅ Visual & Audio Alerts
- Browser notification popup
- Notification sound on new orders
- Visual bell icon indicator

---

## Notification Types

### 1. New Order Notification
```
🎉 New Order Received!
You have 1 new order. Check your dashboard.
```

### 2. Foreground Message (when admin is active)
- Instant notification without delay
- Updates order list automatically
- Shows notification popup

### 3. Background Message (when tab is inactive)
- Browser shows system notification
- Click to return to dashboard
- Persistent until clicked

---

## Browser Compatibility

| Browser | Notifications | Background | Sound |
|---------|--------------|------------|-------|
| Chrome | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Safari | ✅ | ⚠️ Limited | ✅ |
| Mobile | ⚠️ Varies | ⚠️ Varies | ❌ |

---

## Troubleshooting

### Notifications Not Working?

**1. Check Browser Permissions**
- Go to browser settings
- Search for "Notifications"
- Ensure your site is allowed to show notifications

**2. Check Console for Errors**
- Open DevTools (F12)
- Check Console tab for FCM errors
- Look for "FCM Token:" message

**3. Verify VAPID Key**
- Ensure `.env` has correct `VITE_FIREBASE_VAPID_KEY`
- Restart dev server after changing `.env`

**4. Check Service Worker**
- Open DevTools → Application → Service Workers
- Verify `firebase-messaging-sw.js` is registered
- Click "Unregister" and refresh if needed

**5. Clear Cache**
- Hard refresh browser (Ctrl+Shift+R)
- Clear site data in DevTools → Application → Storage

### FCM Token Not Generated?

- Check if VAPID key is set in `.env`
- Verify service worker config is correct
- Check browser console for errors
- Try in incognito mode

---

## Advanced: Backend Integration (Optional)

To send notifications from your backend when orders are created:

### Using Firebase Admin SDK (Node.js)

```javascript
const admin = require('firebase-admin');

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Send notification
const message = {
  notification: {
    title: '🎉 New Order Received!',
    body: 'Order #12345 for ₹5,000'
  },
  token: userFCMToken // Get from Firestore where you stored it
};

admin.messaging().send(message)
  .then((response) => {
    console.log('Notification sent:', response);
  })
  .catch((error) => {
    console.error('Error sending notification:', error);
  });
```

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit** `firebase-messaging-sw.js` with real credentials
2. Use environment variables for sensitive data
3. Implement proper authentication before sending notifications
4. Validate FCM tokens before sending
5. Rate-limit notification sending to prevent abuse

---

## Testing Checklist

- [ ] VAPID key added to `.env`
- [ ] Service worker config updated
- [ ] Admin can enable notifications
- [ ] Bell icon turns green when enabled
- [ ] New order triggers notification
- [ ] Notification sound plays
- [ ] Browser notification popup shows
- [ ] Click notification opens dashboard
- [ ] Works when tab is in background

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify all Firebase credentials are correct
3. Ensure notifications are allowed in browser
4. Test with different browsers
5. Check Firebase Console for quota/errors

---

## Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications Guide](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
