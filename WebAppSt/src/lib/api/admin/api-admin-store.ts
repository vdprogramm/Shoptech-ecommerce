import { axiosClient } from "@/lib/api/axios-client";

export interface IStore {
  _id?: string;
  name: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  isActive: boolean;
  managerId: string; // Khớp với Types.ObjectId từ Backend
  createdAt?: string;
}

export const adminStoreService = {
  // GET /stores
  async getStores() {
    const response = await axiosClient.get<IStore[]>("/stores");
    return response.data;
  },

  // GET /stores/:id
  async getStoreById(id: string) {
    const response = await axiosClient.get<IStore>(`/stores/${id}`);
    return response.data;
  },

  // POST /stores
  async createStore(data: Omit<IStore, "_id">) {
    const response = await axiosClient.post<IStore>("/stores", data);
    return response.data;
  },

  // PATCH /stores/:id
  async updateStore(id: string, data: Partial<IStore>) {
    const response = await axiosClient.patch<IStore>(`/stores/${id}`, data);
    return response.data;
  },

  // DELETE /stores/:id
  async deleteStore(id: string) {
    const response = await axiosClient.delete<{ message: string }>(`/stores/${id}`);
    return response.data;
  },
};
