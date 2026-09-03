import axiosClient from "./axios-client";

export const paymentService = {
  createVnpayUrl: async (orderId: string, amount: number) => {
    const response = await axiosClient.post(
      `/payments/create-url?orderId=${orderId}&amount=${amount}`,
    );
    return response.data;
  },
  createVietqrUrl: async (subOrderId: string) => {
    const response = await axiosClient.post("/vietqr/generate", { subOrderId });
    return response.data;
  },
};
