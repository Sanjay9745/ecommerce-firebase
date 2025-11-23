# 🔧 Firebase Setup Instructions

## Step 1: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Firebase configuration:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project (or create a new one)
   - Click on the gear icon ⚙️ → Project Settings
   - Scroll down to "Your apps" section
   - Click on the web app (</>) icon
   - Copy the configuration values

3. Update `.env` with your Firebase values:
   ```env
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

## Step 2: Deploy Firestore Security Rules

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project
   - Keep `firestore.rules` as the rules file
   - Choose NOT to overwrite existing rules

4. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Step 3: Enable Authentication

1. Go to Firebase Console → Authentication
2. Click "Get Started"
3. Enable "Email/Password" sign-in method
4. Click "Save"

## Step 4: Create Firestore Database

1. Go to Firebase Console → Firestore Database
2. Click "Create database"
3. Choose "Start in production mode"
4. Select your preferred location
5. Click "Enable"

## Step 5: Create Your First Admin User

### Option A: Using Firebase Console (Easiest)

1. Go to Firebase Console → Authentication → Users
2. Click "Add User"
3. Enter email: `admin@wisania.com` (or your preferred email)
4. Enter a strong password (min 8 characters recommended)
5. Click "Add User"
6. **Important:** Copy the user's UID for the next step

### Option B: Using the Setup Script (Recommended)

1. Install Firebase Admin SDK:
   ```bash
   npm install firebase-admin
   ```

2. Download Service Account Key:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `scripts/serviceAccountKey.json`
   - **NEVER commit this file to git!**

3. Run the admin setup script:
   ```bash
   # Create the user in Firebase Console first, then run:
   node scripts/setup-admin.js admin@wisania.com
   ```

4. The user must sign out and sign back in for admin privileges to take effect

## Step 6: Get Gemini API Key (Optional - for AI descriptions)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Add it to your `.env` file:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

## Step 7: Test Your Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173/admin`

3. Sign in with your admin credentials

4. You should be redirected to the admin dashboard

## 🔒 Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Service account key is in `.gitignore`
- [ ] Firestore rules are deployed
- [ ] Authentication is enabled
- [ ] Admin user has custom claims set
- [ ] Strong password is used for admin account
- [ ] Environment variables are configured

## 🐛 Troubleshooting

### "Access denied" when logging in as admin
- Ensure custom claims are set using the setup script
- Sign out and sign back in
- Check that Firestore rules are deployed

### "Permission denied" in Firestore
- Verify Firestore rules are deployed: `firebase deploy --only firestore:rules`
- Check that the user has the admin custom claim

### Environment variables not loading
- Restart the dev server after changing `.env`
- Ensure variables start with `VITE_`
- Check for typos in variable names

### Gemini API not working
- Verify API key is correct in `.env`
- Check API key has proper permissions
- Ensure you're not hitting rate limits

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [ADMIN_SETUP.md](./ADMIN_SETUP.md) - Detailed admin management guide
