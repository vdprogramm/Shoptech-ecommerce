import { axiosClient } from "./axios-client";

export const apiWarranty = {
  // Lấy tất cả bảo hành cho Admin
  getAllWarranties: () => {
    return axiosClient.get("/warranties");
  },

  // Lấy danh sách bảo hành của Merchant
  getMerchantWarranties: () => {
    return axiosClient.get("/warranties/merchant");
  },

  // Lấy danh sách bảo hành của User
  getMyWarranties: () => {
    return axiosClient.get("/warranties/my-warranties");
  },

  // Admin / Merchant tạo bảo hành mới
  createWarranty: (data: {
    userId: string;
    orderId: string;
    productId: string;
    startDate: string;
    durationMonths: number;
  }) => {
    return axiosClient.post("/warranties", data);
  },

  // Admin / Merchant cập nhật bảo hành
  updateWarranty: (id: string, data: any) => {
    return axiosClient.patch(`/warranties/${id}`, data);
  },

  // Admin / Merchant xóa bảo hành
  deleteWarranty: (id: string) => {
    return axiosClient.delete(`/warranties/${id}`);
  },
};
