import { axiosClient } from "@/lib/api/axios-client";

export interface ICategory {
  _id?: string;
  name: string;
  description?: string;
  image?: string;
  storeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const adminCategoryService = {
  async getCategories(storeId?: string) {
    const url = storeId ? `/categories?storeId=${storeId}` : "/categories";
    const response = await axiosClient.get<ICategory[]>(url);
    return response.data;
  },

  async getCategoryById(id: string) {
    const response = await axiosClient.get<ICategory>(`/categories/${id}`);
    return response.data;
  },

  async createCategory(data: Partial<ICategory>) {
    const response = await axiosClient.post<ICategory>("/categories", data);
    return response.data;
  },

  async updateCategory(id: string, data: Partial<ICategory>) {
    const response = await axiosClient.patch<ICategory>(`/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: string) {
    const response = await axiosClient.delete(`/categories/${id}`);
    return response.data;
  },
};
