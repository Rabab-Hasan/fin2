import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read_status: boolean;
  action_url?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Get current user ID (you'll need to implement this based on your auth system)
  const getCurrentUserId = (): string | null => {
    // This should be replaced with your actual auth logic
    const user = localStorage.getItem('user');
    console.log('Raw user data from localStorage:', user);
    
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        console.log('Parsed user data:', parsedUser);
        
        const userId = parsedUser._id || parsedUser.id;
        console.log('Extracted user ID:', userId);
        
        return userId;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    console.log('No user data found in localStorage');
    return null;
  };

  const fetchNotifications = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('No user ID found for notifications');
      return;
    }

    console.log('Fetching notifications for user:', userId);
    setLoading(true);
    try {
      const url = `/api/notifications?userId=${userId}&limit=50`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);

      if (data.success) {
        console.log('Setting notifications:', data.data);
        setNotifications(data.data);
      } else {
        console.error('API returned success: false', data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUnreadCount = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('No user ID found for unread count');
      return;
    }

    console.log('Fetching unread count for user:', userId);
    try {
      const url = `/api/notifications/unread-count?userId=${userId}`;
      console.log('Fetching unread count from URL:', url);
      
      const response = await fetch(url);
      console.log('Unread count response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Unread count API Response:', data);

      if (data.success) {
        console.log('Setting unread count:', data.count);
        setUnreadCount(data.count);
      } else {
        console.error('Unread count API returned success: false', data);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, read_status: true }
              : notification
          )
        );
        
        // Refresh unread count
        await refreshUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read_status: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Remove from local state
        setNotifications(prev =>
          prev.filter(notification => notification.id !== notificationId)
        );
        
        // Refresh unread count
        await refreshUnreadCount();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Fetch notifications and unread count on mount
  useEffect(() => {
    fetchNotifications();
    refreshUnreadCount();
    
    // Set up polling for new notifications (every 30 seconds)
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;