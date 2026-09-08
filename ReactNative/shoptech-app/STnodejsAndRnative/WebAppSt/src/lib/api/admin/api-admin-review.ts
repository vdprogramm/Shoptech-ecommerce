import axiosClient from "../axios-client";

export interface IAdminReview {
  _id: string;
  user: any;
  product: any;
  store?: any;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export const apiAdminReview = {
  // Lấy tất cả đánh giá
  getAllReviews: async (): Promise<IAdminReview[]> => {
    // Gọi API lấy danh sách tất cả reviews (Giả định backend có endpoint GET /reviews hoặc GET /admin/reviews)
    // Thông thường nếu API chung, admin gọi GET /reviews sẽ lấy hết.
    const response = await axiosClient.get("/reviews");
    // Nếu API backend trả về danh sách trong response.data
    return response.data;
  },

  // Xóa đánh giá
  deleteReview: async (reviewId: string) => {
    const response = await axiosClient.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};
