import { axiosClient } from "@/lib/api/axios-client";

export interface IBrand {
  _id?: string;
  name: string;
  description?: string;
  logo?: string;
  storeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const adminBrandService = {
  async getBrands(storeId?: string) {
    const url = storeId ? `/brands?storeId=${storeId}` : "/brands";
    const response = await axiosClient.get<IBrand[]>(url);
    return response.data;
  },

  async getBrandById(id: string) {
    const response = await axiosClient.get<IBrand>(`/brands/${id}`);
    return response.data;
  },

  async createBrand(data: Partial<IBrand>) {
    const response = await axiosClient.post<IBrand>("/brands", data);
    return response.data;
  },

  async updateBrand(id: string, data: Partial<IBrand>) {
    const response = await axiosClient.patch<IBrand>(`/brands/${id}`, data);
    return response.data;
  },

  async deleteBrand(id: string) {
    const response = await axiosClient.delete(`/brands/${id}`);
    return response.data;
  },
};
