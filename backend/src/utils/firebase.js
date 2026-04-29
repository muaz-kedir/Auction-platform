const admin = require("firebase-admin");

// Initialize Firebase Admin with service account
// You need to download the service account key from Firebase Console
// and save it as backend/firebase-service-account.json
let firebaseApp = null;

const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccount = require("../firebase-service-account.json");
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log("✅ Firebase Admin initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
    console.log("⚠️ Make sure to download service account key from Firebase Console");
    console.log("⚠️ Save it as backend/firebase-service-account.json");
    return null;
  }
};

const getFirebaseApp = () => {
  if (!firebaseApp) {
    return initFirebase();
  }
  return firebaseApp;
};

// Send push notification to a single user
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  try {
    const app = getFirebaseApp();
    if (!app) {
      console.error("Firebase not initialized, cannot send notification");
      return false;
    }

    const message = {
      token: fcmToken,
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: data.url || "/notifications"
      },
      webpush: {
        fcm_options: {
          link: data.url || "/notifications"
        }
      }
    };

    const response = await admin.messaging(app).send(message);
    console.log("✅ Push notification sent successfully:", response);
    return true;
  } catch (error) {
    console.error("❌ Error sending push notification:", error.message);
    
    // If token is invalid, log it for cleanup
    if (error.code === 'messaging/registration-token-not-registered') {
      console.log("⚠️ Invalid FCM token, needs cleanup:", fcmToken);
    }
    
    return false;
  }
};

// Send push notification to multiple users
const sendPushNotificationToMultiple = async (fcmTokens, title, body, data = {}) => {
  try {
    const app = getFirebaseApp();
    if (!app) {
      console.error("Firebase not initialized, cannot send notifications");
      return false;
    }

    const message = {
      tokens: fcmTokens,
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: data.url || "/notifications"
      },
      webpush: {
        fcm_options: {
          link: data.url || "/notifications"
        }
      }
    };

    const response = await admin.messaging(app).sendMulticast(message);
    console.log("✅ Push notifications sent:", response.successCount, "success,", response.failureCount, "failed");
    
    // Log invalid tokens for cleanup
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(fcmTokens[idx]);
        }
      });
      if (invalidTokens.length > 0) {
        console.log("⚠️ Invalid FCM tokens to clean up:", invalidTokens);
      }
    }
    
    return response;
  } catch (error) {
    console.error("❌ Error sending push notifications:", error.message);
    return false;
  }
};

// Send notification to all buyers
const sendNotificationToBuyers = async (title, body, data = {}) => {
  try {
    const User = require("../models/User");
    const buyers = await User.find({ role: "buyer", fcmToken: { $ne: null } }).select("fcmToken");
    
    const fcmTokens = buyers.map(b => b.fcmToken).filter(token => token);
    
    if (fcmTokens.length === 0) {
      console.log("⚠️ No buyers with FCM tokens found");
      return false;
    }
    
    console.log(`📢 Sending notification to ${fcmTokens.length} buyers`);
    return await sendPushNotificationToMultiple(fcmTokens, title, body, data);
  } catch (error) {
    console.error("❌ Error sending notification to buyers:", error.message);
    return false;
  }
};

module.exports = {
  initFirebase,
  getFirebaseApp,
  sendPushNotification,
  sendPushNotificationToMultiple,
  sendNotificationToBuyers
};
