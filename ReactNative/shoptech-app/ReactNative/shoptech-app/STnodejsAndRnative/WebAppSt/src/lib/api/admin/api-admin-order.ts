import { axiosClient } from "@/lib/api/axios-client";

export const adminOrderService = {
  async getAllOrders() {
    const response = await axiosClient.get("/orders");
    return response.data;
  },
  async updateOrderStatus(id: string, status: string) {
    const response = await axiosClient.patch(`/orders/${id}`, { status });
    return response.data;
  },
};
