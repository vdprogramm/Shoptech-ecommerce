import axiosClient from "./axios-client";

export interface IShippingMethod {
  _id: string;
  name: string;
  baseFee: number;
  estimatedDays: string;
  description?: string;
  isActive: boolean;
}

export const shippingMethodService = {
  getActiveMethods: async () => {
    const response = await axiosClient.get("/shipping-methods/active");
    return response.data as IShippingMethod[];
  },
};
