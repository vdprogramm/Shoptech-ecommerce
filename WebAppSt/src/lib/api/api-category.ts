import { axiosClient } from "./axios-client";

const categoryApi = axiosClient.create({
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const categoryService = {
  getAllCategories: async (): Promise<Category[]> => {
    const response = await axiosClient.get("/categories");
    return response.data;
  },

  getCategoryById: async (id: string): Promise<Category> => {
    const response = await axiosClient.get(`/categories/${id}`);
    return response.data;
  },
};
