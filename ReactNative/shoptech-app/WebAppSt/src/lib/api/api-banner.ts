import { axiosClient } from "./axios-client";

export interface IBanner {
  _id: string;
  title: string;
  imageUrl: string;
  targetLink?: string;
  position: "TopSlider" | "Sidebar" | "Popup";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const bannerService = {
  // Lấy các banner đang active cho Client
  getActiveBanners: async (position?: string): Promise<IBanner[]> => {
    const params = position ? { position } : {};
    const response = await axiosClient.get("/banners/active", { params });
    return response.data;
  },

  // ADMIN: Lấy tất cả banner
  findAll: async (): Promise<IBanner[]> => {
    const response = await axiosClient.get("/banners");
    return response.data;
  },

  // ADMIN: Tạo banner mới
  create: async (data: Partial<IBanner>): Promise<IBanner> => {
    const response = await axiosClient.post("/banners", data);
    return response.data;
  },

  // ADMIN: Bật/Tắt banner
  toggleActive: async (id: string, isActive: boolean): Promise<IBanner> => {
    const response = await axiosClient.patch(`/banners/${id}/toggle`, { isActive });
    return response.data;
  },

  // ADMIN: Cập nhật banner
  update: async (id: string, data: Partial<IBanner>): Promise<IBanner> => {
    const response = await axiosClient.patch(`/banners/${id}`, data);
    return response.data;
  },

  // ADMIN: Xóa banner
  remove: async (id: string): Promise<void> => {
    const response = await axiosClient.delete(`/banners/${id}`);
    return response.data;
  },
};
