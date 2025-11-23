# Admin Setup Guide for Wisania

This guide explains how to create and manage admin users in your Wisania application.

## Prerequisites

- Firebase project set up
- Firebase Admin SDK access
- Node.js installed

## Method 1: Using Firebase Admin SDK (Recommended)

### Step 1: Install Firebase Admin SDK

```bash
npm install firebase-admin
```

### Step 2: Create a Setup Script

Create a file `scripts/setup-admin.js`:

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin with service account
// Download service account key from Firebase Console > Project Settings > Service Accounts
const serviceAccount = require('./path-to-your-serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setAdminClaim(email) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Set custom claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    // Add to Firestore admins collection
    await admin.firestore().collection('admins').doc(user.uid).set({
      email: user.email,
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Admin privileges granted to ${email}`);
    console.log(`User must sign out and sign in again for changes to take effect.`);
  } catch (error) {
    console.error('Error setting admin claim:', error);
  }
}

// Replace with your admin email
setAdminClaim('admin@wisania.com');
```

### Step 3: Run the Script

```bash
node scripts/setup-admin.js
```

## Method 2: Using Firebase Console (Quick Setup)

### Step 1: Create User in Firebase Console

1. Go to Firebase Console → Authentication → Users
2. Click "Add User"
3. Enter email: `admin@wisania.com`
4. Enter password (min 6 characters)
5. Click "Add User"

### Step 2: Set Custom Claims via Cloud Functions

Deploy this Cloud Function:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.setAdminRole = functions.https.onCall(async (data, context) => {
  // Check if request is made by existing admin
  if (context.auth.token.admin !== true) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can create new admins.'
    );
  }

  const email = data.email;
  
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    await admin.firestore().collection('admins').doc(user.uid).set({
      email: user.email,
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { message: `Admin role granted to ${email}` };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

## Method 3: Manual Firestore Setup (Initial Admin)

For your very first admin user:

1. Create the user via Firebase Console Authentication
2. Note the user's UID
3. Go to Firestore Database
4. Create a collection named `admins`
5. Create a document with the user's UID as the document ID
6. Add these fields:
   - `email`: admin email (string)
   - `isAdmin`: true (boolean)
   - `createdAt`: current timestamp (timestamp)

**Important:** This alone won't work for security rules. You MUST set custom claims using Firebase Admin SDK.

## Testing Admin Access

1. Sign out if already signed in
2. Go to `/admin` route
3. Sign in with admin credentials
4. You should be redirected to `/admin/dashboard`

## Admin Credentials for Development

**Default Admin:**
- Email: `admin@wisania.com`
- Password: Set this in Firebase Console

**Important Security Notes:**
- Change default password immediately
- Use strong passwords (12+ characters)
- Enable 2FA for admin accounts in production
- Never commit credentials to version control
- Use environment variables for sensitive data

## Revoking Admin Access

To remove admin privileges:

```javascript
admin.auth().setCustomUserClaims(userId, { admin: null });
await admin.firestore().collection('admins').doc(userId).delete();
```

## Troubleshooting

### "Access denied" after login
- User might not have custom claim set
- Try signing out and signing back in
- Verify custom claims: `user.getIdTokenResult().then(token => console.log(token.claims))`

### Firestore permission denied
- Check that firestore.rules are deployed
- Verify custom claims are set correctly
- Ensure user is authenticated

### Can't set custom claims
- Verify Firebase Admin SDK is initialized correctly
- Check service account has proper permissions
- Ensure you're using server-side code (not client-side)

## Production Recommendations

1. **Use Firebase Cloud Functions** to manage admin creation
2. **Implement audit logging** for admin actions
3. **Set up email notifications** for admin changes
4. **Use Firebase App Check** to prevent abuse
5. **Enable Firebase Security Rules** (already configured)
6. **Regular security audits** of admin accounts
7. **Implement rate limiting** on admin endpoints

## Additional Security

Consider implementing:
- IP whitelisting for admin access
- Time-based access controls
- Multi-factor authentication
- Session timeout for admin users
- Audit trails for all admin actions
