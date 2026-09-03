import axiosClient from "./axios-client"; // Sử dụng instance chung duy nhất

// --- CÁC INTERFACE GIỮ NGUYÊN ĐỂ ĐỒNG BỘ CẤU TRÚC BACKEND ---

export interface ISaleItemVariant {
  variantId: string;
  salePrice: number;
  originalPrice: number;
  soldCount: number;
  limitStock: number;
}

export interface IProductFlashSaleResponse {
  isFlashSale: boolean;
  campaignId: string | null;
  campaignName?: string;
  endTime: string | null;
  saleItems: ISaleItemVariant[];
}

export interface Product {
  _id: string;
  name: string;
  store: string;
  category: string;
  brand: string | any;
  variants?: any[];
  price: number;
  originalPrice?: number;
  stock: number;
  images: string[];
  isAvailable: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt?: string;
  updatedAt?: string;
  flashSale?: any;
}

export interface IProductSpec {
  _id?: string;
  key: string;
  value: string;
}

export interface IProductVariant {
  _id: string;
  product: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  imageUrl?: string;
  flashSale?: any;
}

export interface IBrand {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 🎯 ĐỒNG BỘ HÀM GỌI API QUA AXIOS-CLIENT TRUNG TÂM
export const getFlashSaleByProductId = async (
  productId: string,
): Promise<IProductFlashSaleResponse> => {
  try {
    const res = await axiosClient.get(`/flash-sales/product/${productId}`);
    return res.data;
  } catch (e) {
    console.warn(`Sản phẩm ${productId} không tham gia chiến dịch Flash Sale hoặc lỗi kết nối.`);
    return {
      isFlashSale: false,
      campaignId: null,
      endTime: null,
      saleItems: [],
    };
  }
};

export const productService = {
  getProducts: async (query?: Record<string, any>): Promise<Product[]> => {
    const response = await axiosClient.get("/products", { params: query });
    return response.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await axiosClient.get(`/products/${id}`);
    return response.data;
  },

  getProductAttributes: async (productId: string): Promise<IProductSpec[]> => {
    const res = await axiosClient.get(`/product-attributes/product/${productId}`);
    return res.data;
  },

  getProductReviews: async (productId: string): Promise<any[]> => {
    const res = await axiosClient.get(`/reviews/product/${productId}`);
    return res.data;
  },

  getProductVariants: async (productId: string): Promise<IProductVariant[]> => {
    const res = await axiosClient.get(`/product-variants/product/${productId}`);
    return res.data;
  },

  getFlashSaleByProductId,

  getBestSellers: async (limit?: number): Promise<Product[]> => {
    const response = await axiosClient.get("/products/best-sellers", { params: { limit } });
    return response.data;
  },

  getBrands: async (): Promise<IBrand[]> => {
    const response = await axiosClient.get("/brands");
    return response.data;
  },

  createProduct: async (data: any): Promise<Product> => {
    const cleanData = { ...data };
    if (cleanData.variants && Array.isArray(cleanData.variants)) {
      cleanData.variants = cleanData.variants.map((v: any) => {
        const attributesPayload: Record<string, string> = {};

        if (v["Màu sắc"]) attributesPayload["Màu sắc"] = String(v["Màu sắc"]).trim();
        if (v["Dung lượng"]) attributesPayload["Dung lượng"] = String(v["Dung lượng"]).trim();

        return {
          sku: v.sku
            ? String(v.sku).toUpperCase().trim()
            : `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
          imageUrl: v.imageUrl || "",
          attributes: attributesPayload,
        };
      });
    }
    const response = await axiosClient.post("/products", cleanData);
    return response.data;
  },

  updateProduct: async (id: string, data: any): Promise<Product> => {
    const cleanData = { ...data };
    if (cleanData.variants && Array.isArray(cleanData.variants)) {
      cleanData.variants = cleanData.variants.map((v: any) => {
        const attributesPayload: Record<string, string> = {};

        if (v["Màu sắc"]) attributesPayload["Màu sắc"] = String(v["Màu sắc"]).trim();
        if (v["Dung lượng"]) attributesPayload["Dung lượng"] = String(v["Dung lượng"]).trim();

        return {
          _id: v._id,
          sku: v.sku
            ? String(v.sku).toUpperCase().trim()
            : `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
          imageUrl: v.imageUrl || "",
          attributes: attributesPayload,
        };
      });
    }
    const response = await axiosClient.put(`/products/${id}`, cleanData);
    return response.data;
  },
};
