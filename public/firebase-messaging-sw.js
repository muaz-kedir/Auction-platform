// Firebase Cloud Messaging Service Worker
// This file handles background push notifications

importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Initialize Firebase in the service worker
// You'll need to replace these with your Firebase project config
firebase.initializeApp({
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
});

// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("📩 Received background message:", payload);

  const notificationTitle = payload.notification?.title || "BidSmart";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || "/notifications",
      click_action: payload.data?.url || "/notifications"
    },
    actions: [
      {
        action: "open",
        title: "Open",
        icon: "/favicon.ico"
      }
    ]
  };

  // Show the notification
  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("🔔 Notification clicked:", event);

  event.notification.close();

  // Get the URL from the notification data
  const url = event.notification.data?.url || "/notifications";

  // Open the URL in a new window or focus existing window
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle push events (for web push protocol)
self.addEventListener("push", (event) => {
  console.log("📨 Push event received:", event);

  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || "You have a new notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/notifications"
    },
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "BidSmart", options)
  );
});
