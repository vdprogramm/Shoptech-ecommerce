import axiosClient from "./axios-client";

export interface ICreateOrderPayload {
  shippingAddress: string;
  paymentMethod: string;
  voucherCode?: string;
  shippingMethod?: string;
}

export const orderService = {
  createOrder: async (payload: ICreateOrderPayload) => {
    const response = await axiosClient.post("/orders", payload);
    return response.data;
  },

  getMyOrders: async (status?: string) => {
    const response = await axiosClient.get("/orders/my-orders", {
      params: status ? { status } : {},
    });
    return response.data;
  },

  getOrderDetails: async (orderId: string) => {
    const response = await axiosClient.get(`/orders/${orderId}`);
    return response.data;
  },

  trackOrderByCode: async (code: string) => {
    const response = await axiosClient.get(`/public-orders/tracking/${code}`);
    return response.data;
  },

  updateSubOrderStatus: async (subOrderId: string, status: string) => {
    const response = await axiosClient.patch(`/orders/merchant/${subOrderId}/status`, {
      status,
    });
    return response.data;
  },

  getAdminOrdersForAdmin: async () => {
    const response = await axiosClient.get("/orders/admin/all");
    return response.data;
  },

  getOrdersByStore: async () => {
    const timestamp = Date.now(); // Lấy thời gian hiện tại
    const { data } = await axiosClient.get(`/orders/store/my-orders?_t=${timestamp}`);
    return data;
  },

  // Cập nhật trạng thái
  updateOrderStatus: async (orderId: string, status: string) => {
    const { data } = await axiosClient.patch(`/orders/merchant/${orderId}/status`, { status });
    return data;
  },

  // Hủy đơn hàng (dành cho người dùng)
  cancelOrder: async (orderId: string) => {
    const { data } = await axiosClient.put(`/orders/${orderId}/cancel`);
    return data;
  },
};
