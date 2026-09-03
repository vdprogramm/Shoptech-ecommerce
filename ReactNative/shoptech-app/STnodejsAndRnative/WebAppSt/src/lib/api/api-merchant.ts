import { axiosClient } from "./axios-client"; // Instance Axios tự động đính kèm Token

export const apiMerchant = {
  getStaff: () => {
    return axiosClient.get("/users/merchant/staff");
  },

  createStaff: (data: any) => {
    return axiosClient.post("/users/merchant/create-staff", data);
  },

  getProducts: () => {
    return axiosClient.get("/products/merchant/list");
  },

  createProduct: (data: any) => {
    return axiosClient.post("/products/merchant", data);
  },

  updateProduct: (id: string, data: any) => {
    return axiosClient.patch(`/products/merchant/${id}`, data);
  },

  deleteProduct: (id: string) => {
    return axiosClient.delete(`/products/merchant/${id}`);
  },
  addStockProduct: (variantId: string, quantity: number) => {
    return axiosClient.patch(`/products/merchant/${variantId}/add-stock`, { quantity });
  },

  upsertProductAttributes: async (
    productId: string,
    attributes: { key: string; value: string }[],
  ) => {
    const response = await axiosClient.post(`/product-attributes/${productId}`, { attributes });
    return response.data;
  },

  getProductAttributes: async (productId: string) => {
    const response = await axiosClient.get(`/product-attributes/product/${productId}`);
    return response.data;
  },
};
