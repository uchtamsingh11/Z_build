'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Types for notification
type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  duration?: number;
}

// Context type
interface NotificationContextProps {
  notifications: Notification[];
  showNotification: (props: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
}

// Create context
const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

// Provider component
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Add a notification
  const showNotification = useCallback((props: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const notification = { id, ...props };
    
    setNotifications((prev) => [...prev, notification]);

    // Auto dismiss after duration (default: 5 seconds)
    if (props.duration !== 0) {
      const duration = props.duration || 5000;
      setTimeout(() => {
        dismissNotification(id);
      }, duration);
    }
  }, []);

  // Remove a notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, dismissNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

// Hook to use notifications
export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// Get icon for notification type
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-500" />;
    default:
      return <Info className="h-5 w-5 text-zinc-400" />;
  }
};

// Get background color based on notification type
const getNotificationBgColor = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'bg-emerald-500/10 border-emerald-500/20';
    case 'error':
      return 'bg-red-500/10 border-red-500/20';
    case 'warning':
      return 'bg-amber-500/10 border-amber-500/20';
    case 'info':
      return 'bg-blue-500/10 border-blue-500/20';
    default:
      return 'bg-zinc-900 border-zinc-800';
  }
};

// Notification container component
function NotificationContainer() {
  const { notifications, dismissNotification } = useNotification();

  return (
    <div className="fixed top-16 right-4 z-[100] flex flex-col gap-3 max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30
            }}
            className="pointer-events-auto"
          >
            <div className={`rounded-lg border px-4 py-3 shadow-lg shadow-black/10 ${getNotificationBgColor(notification.type)} backdrop-blur-sm`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-grow">
                  <h4 className="text-sm font-medium font-mono tracking-wide text-white">{notification.title}</h4>
                  {notification.description && (
                    <p className="mt-1 text-xs text-zinc-300">{notification.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0 -mr-1 -mt-1 text-zinc-400 hover:text-white hover:bg-white/10"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Utility functions for showing notifications
export function showToast(
  title: string,
  type: NotificationType = 'default',
  description?: string,
  duration: number = 5000
) {
  // This will be used inside components to show notifications
  const context = useContext(NotificationContext);
  if (context) {
    context.showNotification({ title, type, description, duration });
  } else {
    console.error('Notification context not available');
  }
}

// Global functions (to be used outside of React components)
let notificationContextValue: NotificationContextProps | null = null;

export function setNotificationContext(context: NotificationContextProps) {
  notificationContextValue = context;
}

export const toast = {
  success: (title: string, description?: string, duration: number = 5000) => {
    if (notificationContextValue) {
      notificationContextValue.showNotification({ title, description, type: 'success', duration });
    }
  },
  error: (title: string, description?: string, duration: number = 5000) => {
    if (notificationContextValue) {
      notificationContextValue.showNotification({ title, description, type: 'error', duration });
    }
  },
  warning: (title: string, description?: string, duration: number = 5000) => {
    if (notificationContextValue) {
      notificationContextValue.showNotification({ title, description, type: 'warning', duration });
    }
  },
  info: (title: string, description?: string, duration: number = 5000) => {
    if (notificationContextValue) {
      notificationContextValue.showNotification({ title, description, type: 'info', duration });
    }
  },
}; 