import { axiosClient } from "./axios-client";

export const apiWarranty = {
  // Lấy danh sách bảo hành của merchant (dựa trên storeId tự động trong token backend)
  getMerchantWarranties: () => {
    return axiosClient.get("/warranties/merchant");
  },

  // (Tuỳ chọn) Tạo phiếu bảo hành thủ công
  createWarranty: (data: {
    userId: string;
    orderId?: string;
    productId: string;
    startDate: string;
    durationMonths: number;
  }) => {
    return axiosClient.post("/warranties", data);
  },

  // (Tuỳ chọn) Cập nhật phiếu bảo hành
  updateWarranty: (id: string, data: any) => {
    return axiosClient.patch(`/warranties/${id}`, data);
  },

  // (Tuỳ chọn) Xóa phiếu bảo hành
  deleteWarranty: (id: string) => {
    return axiosClient.delete(`/warranties/${id}`);
  }
};
