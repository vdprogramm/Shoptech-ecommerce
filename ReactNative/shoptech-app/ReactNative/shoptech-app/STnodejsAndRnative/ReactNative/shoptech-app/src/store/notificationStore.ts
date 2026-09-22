import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

export interface Notification {
    _id: string;
    user: string;
    title: string;
    message: string;
    isRead: boolean;
    orderId?: string;
    createdAt: string;
    updatedAt?: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;

    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    // 1. Lấy danh sách thông báo của user (GET /notifications)
    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/notifications');
            const data: Notification[] = response.data || response || [];
            const unread = data.filter((n) => !n.isRead).length;
            set({ notifications: data, unreadCount: unread, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy danh sách thông báo:', error);
            set({ notifications: [], isLoading: false });
        }
    },

    // 2. Đánh dấu 1 thông báo đã đọc (PATCH /notifications/:id/read)
    markAsRead: async (id: string) => {
        try {
            await axiosClient.patch(`/notifications/${id}/read`);

            // Cập nhật trực tiếp trong store (optimistic update)
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n._id === id ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch (error) {
            console.log('Lỗi đánh dấu đã đọc:', error);
        }
    },

    // 3. Đánh dấu tất cả thông báo đã đọc (gọi lần lượt tất cả chưa đọc)
    markAllAsRead: async () => {
        const unreadList = get().notifications.filter((n) => !n.isRead);
        try {
            await Promise.all(
                unreadList.map((n) => axiosClient.patch(`/notifications/${n._id}/read`))
            );
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
                unreadCount: 0,
            }));
        } catch (error) {
            console.log('Lỗi đánh dấu tất cả đã đọc:', error);
        }
    },
}));
