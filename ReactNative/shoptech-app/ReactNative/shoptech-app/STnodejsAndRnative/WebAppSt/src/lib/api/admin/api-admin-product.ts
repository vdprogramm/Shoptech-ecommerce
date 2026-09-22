import { axiosClient } from "@/lib/api/axios-client";

export interface IProduct {
  _id?: string;
  name: string;
  store: string | { _id: string; name: string };
  category: string | { _id: string; name: string };
  brand: string | { _id: string; name: string };
  variants?: string[];
  price: number;
  stock: number;
  images: string[];
  isAvailable: boolean;
  averageRating?: number;
  reviewCount?: number;
  createdAt?: string;
}

export const adminProductService = {
  async getProducts() {
    const response = await axiosClient.get<IProduct[]>("/products");
    return response.data;
  },

  async createProduct(data: any) {
    const response = await axiosClient.post<IProduct>("/products/merchant", data);
    return response.data;
  },

  async updateProduct(id: string, data: Partial<IProduct>) {
    const response = await axiosClient.patch<IProduct>(`/products/merchant/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: string) {
    const response = await axiosClient.delete(`/products/merchant/${id}`);
    return response.data;
  },

  async getVariantsByProduct(productId: string) {
    const response = await axiosClient.get(`/product-variants/product/${productId}`);
    return response.data;
  },

  async upsertProductAttributes(productId: string, attributes: { key: string; value: string }[]) {
    const response = await axiosClient.post(`/product-attributes/${productId}`, { attributes });
    return response.data;
  },

  async getProductAttributes(productId: string) {
    const response = await axiosClient.get(`/product-attributes/product/${productId}`);
    return response.data;
  },

  // POST 'product-variants/:productId'
  async createProductVariant(
    productId: string,
    data: {
      sku: string;
      attributes: Record<string, string>;
      price: number;
      stock: number;
      imageUrl?: string;
    },
  ) {
    const response = await axiosClient.post(`/product-variants/${productId}`, data);
    return response.data;
  },

  // PATCH 'product-variants/:variantId/add-stock'
  async addVariantStock(variantId: string, quantity: number) {
    const response = await axiosClient.patch(`/product-variants/${variantId}/add-stock`, {
      quantity,
    });
    return response.data;
  },

  async getCategories() {
    const response = await axiosClient.get<any[]>("/categories");
    return response.data;
  },

  async getBrands() {
    const response = await axiosClient.get<any[]>("/brands");
    return response.data;
  },

  async getStores() {
    const response = await axiosClient.get("/stores"); // Endpoint lấy danh sách store của bạn
    return response.data;
  },
};
