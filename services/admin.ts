import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Check if a user has admin privileges
 * This checks the custom claims on the user's token
 */
export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user || user.uid !== userId) return false;
    
    // Get the ID token result which contains custom claims
    const idTokenResult = await user.getIdTokenResult();
    
    // Check if the admin claim exists and is true
    return idTokenResult.claims.admin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

/**
 * Verify if current user is an admin by checking Firestore
 * This is a fallback method or for initial setup
 */
export const verifyAdminInFirestore = async (userId: string): Promise<boolean> => {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    return adminDoc.exists() && adminDoc.data()?.isAdmin === true;
  } catch (error) {
    console.error("Error verifying admin in Firestore:", error);
    return false;
  }
};

/**
 * Get admin user data
 */
export const getAdminData = async (userId: string) => {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    if (adminDoc.exists()) {
      return adminDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting admin data:", error);
    return null;
  }
};

/**
 * Add admin user to Firestore
 * Note: You'll need to manually set custom claims using Firebase Admin SDK
 * This is just for storing admin metadata in Firestore
 */
export const addAdminToFirestore = async (userId: string, email: string) => {
  try {
    await setDoc(doc(db, 'admins', userId), {
      email,
      isAdmin: true,
      createdAt: Date.now()
    });
    console.log("Admin added to Firestore successfully");
    return true;
  } catch (error) {
    console.error("Error adding admin to Firestore:", error);
    return false;
  }
};
