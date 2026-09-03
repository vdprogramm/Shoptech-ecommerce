import axiosClient from "./axios-client";

export interface IReview {
  _id: string;
  user: any; // Populated user object or string ID
  product: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export const reviewService = {
  // LẤY DANH SÁCH BÌNH LUẬN THEO SẢN PHẨM
  getReviewsByProduct: async (productId: string): Promise<IReview[]> => {
    const response = await axiosClient.get(`/reviews/product/${productId}`);
    return response.data;
  },

  // LẤY TỔNG SỐ LƯỢNG BÌNH LUẬN
  getReviewCount: async (productId: string): Promise<{ count: number }> => {
    const response = await axiosClient.get(`/reviews/product/${productId}/count`);
    return response.data;
  },

  // THÊM BÌNH LUẬN
  addReview: async (payload: { productId: string; rating: number; comment: string }) => {
    const response = await axiosClient.post("/reviews", payload);
    return response.data;
  },

  // CẬP NHẬT BÌNH LUẬN
  updateReview: async (reviewId: string, payload: { rating: number; comment: string }) => {
    const response = await axiosClient.patch(`/reviews/${reviewId}`, payload);
    return response.data;
  },

  // XÓA BÌNH LUẬN
  deleteReview: async (reviewId: string) => {
    const response = await axiosClient.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};
