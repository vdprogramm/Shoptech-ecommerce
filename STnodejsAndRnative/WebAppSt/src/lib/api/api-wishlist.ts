import axiosClient from "./axios-client";
import { Product } from "@/components/site/ProductCard";

export const wishlistsService = {
  // KHÁCH LẤY DANH SÁCH ĐÃ THẢ TIM
  async getMyWishlist(): Promise<Product[]> {
    const response = await axiosClient.get("/wishlists");
    return response.data;
  },

  // KHÁCH BẤM NÚT TRÁI TIM TRÊN SẢN PHẨM
  async toggleWishlist(productId: string): Promise<{ message?: string; isLiked?: boolean }> {
    const response = await axiosClient.post(`/wishlists/${productId}/toggle`);
    return response.data;
  },

  // KIỂM TRA SẢN PHẨM ĐÃ ĐƯỢC THẢ TIM CHƯA
  async checkIsLiked(productId: string): Promise<{ isLiked: boolean }> {
    const response = await axiosClient.get(`/wishlists/check/${productId}`);
    return response.data;
  },
};
