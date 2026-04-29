import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAiraoD1N3CjfR2fiMb7zVro7w_GaYdhfM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bid-smart-314c5.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bid-smart-314c5",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bid-smart-314c5.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "822376997104",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:822376997104:web:6eb1277c5e58b259926235",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(app);

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      console.log("✅ Notification permission granted");
      
      // Get FCM token
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "YOUR_VAPID_KEY";
      const token = await getToken(messaging, { vapidKey });
      
      console.log("🔑 FCM Token:", token);
      return token;
    } else {
      console.log("⚠️ Notification permission denied");
      return null;
    }
  } catch (error) {
    console.error("❌ Error requesting notification permission:", error);
    return null;
  }
};

// Get FCM token without requesting permission (useful for refreshing)
export const getFcmToken = async (): Promise<string | null> => {
  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "YOUR_VAPID_KEY";
    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.error("❌ Error getting FCM token:", error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  return onMessage(messaging, callback);
};

export { app, messaging };
