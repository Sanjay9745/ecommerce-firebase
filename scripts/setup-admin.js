// Admin Setup Script (ES Module compatible)
// Uses ESM imports and reads service account JSON via fs

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Resolve service account path
const serviceAccountPath = path.join(process.cwd(), 'scripts', 'serviceAccountKey.json');

// Initialize Firebase Admin SDK
function initAdmin() {
  try {
    if (!fs.existsSync(serviceAccountPath)) {
      console.error('❌ serviceAccountKey.json not found at:', serviceAccountPath);
      console.error('Please download the service account key from Firebase Console and place it at scripts/serviceAccountKey.json');
      process.exit(1);
    }

    const raw = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(raw);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin initialized successfully');
  } catch (err) {
    console.error('❌ Error initializing Firebase Admin:', err?.message || err);
    process.exit(1);
  }
}

/**
 * Set admin custom claim and Firestore record
 */
async function setAdminClaim(email) {
  try {
    console.log(`\n🔍 Looking up user: ${email}`);

    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log(`✅ Found user with UID: ${user.uid}`);

    // Set custom claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log('✅ Custom admin claim set');

    // Add to Firestore admins collection
    await admin.firestore().collection('admins').doc(user.uid).set({
      email: user.email,
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Admin record created in Firestore');

    console.log('\n🎉 Success! Admin privileges granted to', email);
    console.log('⚠️  Important: User must sign out and sign in again for changes to take effect.\n');
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`\n❌ User not found: ${email}`);
      console.error('Please create this user in Firebase Console first:');
      console.error('Firebase Console > Authentication > Users > Add User\n');
    } else {
      console.error('\n❌ Error setting admin claim:', error?.message || error);
    }
  } finally {
    process.exit();
  }
}

/**
 * Remove admin privileges
 */
async function removeAdminClaim(email) {
  try {
    console.log(`\n🔍 Looking up user: ${email}`);

    const user = await admin.auth().getUserByEmail(email);
    console.log(`✅ Found user with UID: ${user.uid}`);

    // Remove custom claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: null });
    console.log('✅ Custom admin claim removed');

    // Remove from Firestore
    await admin.firestore().collection('admins').doc(user.uid).delete();
    console.log('✅ Admin record removed from Firestore');

    console.log('\n🎉 Success! Admin privileges revoked from', email);
    console.log('⚠️  User must sign out and sign in again for changes to take effect.\n');
  } catch (error) {
    console.error('\n❌ Error removing admin claim:', error?.message || error);
  } finally {
    process.exit();
  }
}

// Entry point
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('\n📖 Usage:');
    console.log('  Grant admin: node scripts/setup-admin.js grant admin@wisania.com');
    console.log('  Revoke admin: node scripts/setup-admin.js revoke admin@wisania.com');
    console.log('  Quick grant: node scripts/setup-admin.js admin@wisania.com\n');
    process.exit(1);
  }

  // Support both: `node scripts/setup-admin.js admin@...` and `node scripts/setup-admin.js grant admin@...`
  let command = args[0];
  let email = args[1];

  if (!email && command && command.includes('@')) {
    email = command;
    command = 'grant';
  }

  if (!email) {
    console.error('❌ Missing email argument');
    process.exit(1);
  }

  initAdmin();

  if (command === 'revoke') {
    await removeAdminClaim(email);
  } else {
    await setAdminClaim(email);
  }
}

main();
