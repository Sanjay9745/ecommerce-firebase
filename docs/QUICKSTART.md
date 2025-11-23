# 🚀 Quick Start Guide - Wisania Admin Setup

## Complete Setup in 5 Minutes

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com/
2. Copy `.env.example` to `.env`
3. Add your Firebase config to `.env` (from Firebase Console → Project Settings)

### 3️⃣ Enable Firebase Services

In Firebase Console:
- **Authentication**: Enable Email/Password
- **Firestore**: Create database in production mode

### 4️⃣ Deploy Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 5️⃣ Create Admin User

**In Firebase Console:**
1. Go to Authentication → Users → Add User
2. Email: `admin@wisania.com`
3. Password: `YourSecurePassword123!`

**Set Admin Privileges:**
```bash
# Download service account key from Firebase Console → Project Settings → Service Accounts
# Save as scripts/serviceAccountKey.json

# Install firebase-admin (if not already installed)
npm install firebase-admin

# Grant admin privileges
npm run setup-admin admin@wisania.com
```

### 6️⃣ Start Development Server

```bash
npm run dev
```

### 7️⃣ Login as Admin

1. Open http://localhost:5173/admin
2. Login with your admin credentials
3. You're in! 🎉

---

## 📋 What Was Fixed

### ✅ Security Improvements
- ✅ Proper Firestore security rules with admin role checks
- ✅ Custom claims for admin authentication
- ✅ Protected routes that verify admin status
- ✅ Environment variables for sensitive config
- ✅ Service account keys gitignored

### ✅ Code Quality
- ✅ Fixed Firebase initialization (removed deprecated compat mode)
- ✅ Fixed Gemini AI integration (correct package and API)
- ✅ Better error handling in database operations
- ✅ Loading states for async operations
- ✅ Proper TypeScript types throughout

### ✅ Admin System
- ✅ Admin custom claims system
- ✅ Admin verification service
- ✅ Setup script for creating admins
- ✅ Proper admin role checking
- ✅ Firestore admin collection

### ✅ Documentation
- ✅ Complete setup guide (FIREBASE_SETUP.md)
- ✅ Admin management guide (ADMIN_SETUP.md)
- ✅ This quick start guide
- ✅ Inline code comments

---

## 🔑 Admin Credentials

**Default Admin:**
- Email: `admin@wisania.com` (or whatever you set)
- Password: Whatever you set in Firebase Console

**Important:** Change these immediately after first login!

---

## 🛡️ Security Rules Explained

Your Firestore is now protected with these rules:

- **Products**: Anyone can read, only admins can write
- **Orders**: Only admins can read/update, anyone can create
- **Admins**: Only accessible to admin users
- **Everything else**: Denied by default

---

## 🔧 Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Create admin user
npm run setup-admin admin@wisania.com

# Remove admin privileges
node scripts/setup-admin.js revoke admin@wisania.com

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

---

## ⚠️ Important Notes

1. **Never commit `.env` or service account keys to Git**
2. **Admin users must sign out and back in after privileges are granted**
3. **Gemini API key is optional** - app works without it (uses fallback descriptions)
4. **Deploy rules before testing** - they're required for security

---

## 🐛 Issues?

### Can't login as admin?
→ Run: `node scripts/setup-admin.js admin@wisania.com`
→ Then sign out and back in

### Permission denied errors?
→ Deploy rules: `firebase deploy --only firestore:rules`

### Environment variables not working?
→ Restart dev server after changing `.env`

---

## 📚 Full Documentation

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Complete Firebase setup
- [ADMIN_SETUP.md](./ADMIN_SETUP.md) - Admin management details

---

**You're all set! Happy coding! 🎉**
