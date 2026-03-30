// D:\yzo_ongoing\Tijara\mobile-app\src\store\notificationStore.js
import { create } from 'zustand';
import { notificationsAPI } from '../api';

export const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  hasMore: true,
  page: 1,

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Fetch notifications
  fetchNotifications: async (refresh = false) => {
    const { page, notifications } = get();
    const currentPage = refresh ? 1 : page;

    set({ isLoading: true, error: null });
    try {
      const response = await notificationsAPI.getNotifications({
        page: currentPage,
        limit: 20,
      });

      const newNotifications = response.data.notifications || [];
      const hasMore = response.data.pagination?.pages > currentPage;

      set({
        notifications: refresh ? newNotifications : [...notifications, ...newNotifications],
        page: currentPage + 1,
        hasMore,
        isLoading: false,
      });

      return response;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Fetch unread count
  fetchUnreadCount: async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      set({ unreadCount: response.data.unreadCount || 0 });
      return response;
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  // Mark as read
  markAsRead: async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      const { notifications, unreadCount } = get();
      
      set({
        notifications: notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, unreadCount - 1),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      await notificationsAPI.markAllAsRead();
      const { notifications } = get();
      
      set({
        notifications: notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },

  // Reset state
  resetNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      error: null,
      hasMore: true,
      page: 1,
    });
  },
}));

export default useNotificationStore;