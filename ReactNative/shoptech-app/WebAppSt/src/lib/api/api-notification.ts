import { axiosClient } from "./axios-client";

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  isRead: boolean;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export const notificationService = {
  /**
   * Lấy lịch sử thông báo của người dùng
   */
  getHistory: async (): Promise<Notification[]> => {
    try {
      const response = await axiosClient.get("/notifications");
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thông báo:", error);
      return [];
    }
  },

  /**
   * Đánh dấu thông báo đã đọc
   * @param id ID của thông báo
   */
  markAsRead: async (id: string): Promise<any> => {
    try {
      const response = await axiosClient.patch(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi đánh dấu thông báo đã đọc:", error);
      throw error;
    }
  },
};
