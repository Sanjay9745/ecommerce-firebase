# 📥 Service Account Key Setup Guide

This file needs to be placed at `scripts/serviceAccountKey.json` to use the admin setup script.

## How to Get Your Service Account Key

### Step 1: Go to Firebase Console
1. Navigate to [Firebase Console](https://console.firebase.google.com/)
2. Select your project

### Step 2: Access Service Accounts
1. Click the gear icon (⚙️) → **Project Settings**
2. Navigate to the **Service Accounts** tab
3. Click **Generate New Private Key**
4. Click **Generate Key** in the dialog

### Step 3: Save the Key
1. A JSON file will be downloaded
2. **Rename it to:** `serviceAccountKey.json`
3. **Move it to:** `scripts/serviceAccountKey.json`

## ⚠️ Security Warning

**NEVER COMMIT THIS FILE TO GIT!**

This file contains sensitive credentials that give full access to your Firebase project.

### Security Checklist:
- [ ] File is in `scripts/` directory
- [ ] File is named exactly `serviceAccountKey.json`
- [ ] File is listed in `.gitignore`
- [ ] File is NOT committed to git
- [ ] File is NOT shared publicly

## File Structure

Your scripts directory should look like this:

```
scripts/
├── serviceAccountKey.json    ← This file (never commit!)
└── setup-admin.js           ← The admin setup script
```

## Using the Service Account Key

Once the file is in place, you can run:

```bash
# Grant admin privileges
npm run setup-admin admin@wisania.com

# Or directly
node scripts/setup-admin.js admin@wisania.com

# Revoke admin privileges
node scripts/setup-admin.js revoke admin@wisania.com
```

## Troubleshooting

### "Cannot find module './serviceAccountKey.json'"
- Make sure the file exists at `scripts/serviceAccountKey.json`
- Check the filename is exactly `serviceAccountKey.json`
- Verify you're in the project root when running commands

### "Permission denied"
- Ensure the service account has proper permissions
- Try re-downloading the key from Firebase Console
- Check that your Firebase project has billing enabled (if required)

### "Invalid service account"
- Make sure you downloaded the key from the correct Firebase project
- Verify the JSON file is not corrupted
- Try generating a new key

## Alternative: Firebase CLI

If you don't want to use service accounts, you can use Firebase CLI:

```bash
# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules

# Use Firebase Emulator for local testing
firebase emulators:start
```

However, **custom claims can only be set using the Admin SDK**, so you'll need the service account key for the admin setup script.

## Production Recommendations

For production, consider:
1. Using Cloud Functions to manage admins
2. Setting up CI/CD with secure environment variables
3. Using Firebase Admin SDK in a secure backend
4. Rotating service account keys regularly
5. Using least-privilege service accounts
