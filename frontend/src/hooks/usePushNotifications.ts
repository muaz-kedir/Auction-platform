import { useEffect } from 'react';
import { onForegroundMessage } from '../firebase';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  useEffect(() => {
    // Listen for foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('📱 Received foreground message:', payload);
      
      const notification = payload.notification;
      if (notification) {
        // Show toast notification when app is in foreground
        toast(notification.title || 'New Notification', {
          description: notification.body,
          action: {
            label: 'View',
            onClick: () => {
              const url = payload.data?.url || '/notifications';
              window.location.href = url;
            }
          }
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
};
