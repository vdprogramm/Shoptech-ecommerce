import axios from "axios"; // BẮT BUỘC: Import axios gốc của thư viện
import axiosClient from "./axios-client";

export interface INews {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

// Lấy BASE_URL từ axiosClient để không phải gõ cứng 'http://localhost:3001'
const baseURL = axiosClient.defaults.baseURL || "http://localhost:3001";

export const newsService = {
  // Các hàm GET và DELETE không có file -> Dùng axiosClient bình thường
  getAllNews: async (): Promise<INews[]> => {
    const response = await axiosClient.get("/news");
    return response.data;
  },

  getNewsById: async (id: string): Promise<INews> => {
    const response = await axiosClient.get(`/news/${id}`);
    return response.data;
  },

  deleteNews: async (id: string): Promise<void> => {
    await axiosClient.delete(`/news/${id}`);
  },

  createNews: async (payload: FormData): Promise<INews> => {
    const response = await axios.post(`${baseURL}/news`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateNews: async (id: string, payload: FormData): Promise<INews> => {
    const response = await axios.put(`${baseURL}/news/${id}`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
