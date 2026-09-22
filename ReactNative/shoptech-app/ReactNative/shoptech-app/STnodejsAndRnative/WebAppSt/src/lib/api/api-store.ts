import axiosClient from "./axios-client";

export interface IStore {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  isActive: boolean;
  managerId?: string;
  createdAt?: string;
}

export const storeService = {
  // Lấy toàn bộ danh sách
  findAll: async (): Promise<IStore[]> => {
    const response = await axiosClient.get("/stores");
    return response.data;
  },

  // Lấy chi tiết cửa hàng
  getStoreById: async (id: string): Promise<IStore> => {
    const response = await axiosClient.get(`/stores/${id}`);
    return response.data;
  },

  // Lấy danh sách cửa hàng của một quản lý
  findByManager: async (managerId: string): Promise<IStore[]> => {
    const response = await axiosClient.get(`/stores/manager/${managerId}`);
    return response.data;
  },

  // Tạo cửa hàng mới
  create: async (data: Partial<IStore>): Promise<IStore> => {
    const response = await axiosClient.post("/stores", data);
    return response.data;
  },

  // Cập nhật thông tin cửa hàng
  update: async (id: string, data: Partial<IStore>): Promise<IStore> => {
    const response = await axiosClient.patch(`/stores/${id}`, data);
    return response.data;
  },

  // Xóa cửa hàng
  remove: async (id: string): Promise<any> => {
    const response = await axiosClient.delete(`/stores/${id}`);
    return response.data;
  },
};
