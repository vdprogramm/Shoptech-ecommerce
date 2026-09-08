import axiosClient from "./axios-client";

export interface IFlashSaleItem {
  variant:
    | {
        _id: string;
        name: string;
        image?: string;
        price: number;
        variantName?: string;
        product?: {
          _id: string;
          name: string;
        };
        imageUrl?: string;
        attributes?: Record<string, string>;
      }
    | string;
  salePrice: number;
  quantityLimit: number;
  soldCount: number;
}

export interface IFlashSaleCampaign {
  _id: string;
  campaignName: string;
  startTime: string;
  endTime: string;
  items: IFlashSaleItem[];
  isActive: boolean;
}

export interface ICreateFlashSaleItemDto {
  variant: string;
  salePrice: number;
  quantityLimit: number;
}

export interface ICreateFlashSaleDto {
  campaignName: string;
  startTime: string;
  endTime: string;
  store?: string | null;
  items: ICreateFlashSaleItemDto[];
}

// 🎯 INTERFACE MỚI: Định dạng dữ liệu trả về cho trang Chi tiết sản phẩm (Khớp cấu trúc Service NestJS mới sửa)
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
  saleItems: ISaleItemVariant[]; // Danh sách ma trận biến thể giảm giá
}

// Đường dẫn tương đối dựa trên cấu hình axiosClient
const PREFIX = "/flash-sales";

export const flashSaleService = {
  getAllCampaigns: async (): Promise<IFlashSaleCampaign[]> => {
    const response = await axiosClient.get(`${PREFIX}`);
    return response.data;
  },

  getCurrentActiveSale: async (): Promise<IFlashSaleCampaign | null> => {
    const response = await axiosClient.get(`${PREFIX}/current`);
    return response.data;
  },

  createFlashSale: async (payload: ICreateFlashSaleDto): Promise<IFlashSaleCampaign> => {
    const response = await axiosClient.post(`${PREFIX}`, payload);
    return response.data;
  },

  // 🎯 HÀM MỚI BỔ SUNG: Lấy thông tin flash sale theo ProductID với cấu trúc mảng biến thể khử lỗi 404
  getFlashSaleByProductId: async (productId: string): Promise<IProductFlashSaleResponse> => {
    try {
      const response = await axiosClient.get(`${PREFIX}/product/${productId}`);
      return response.data;
    } catch (e) {
      // Trường hợp lỗi kết nối hoặc bất kỳ sự cố nào, fallback về trạng thái không sale an toàn
      return {
        isFlashSale: false,
        campaignId: null,
        endTime: null,
        saleItems: [],
      };
    }
  },

  updateFlashSale: async (id: string, payload: any): Promise<IFlashSaleCampaign> => {
    const response = await axiosClient.put(`${PREFIX}/${id}`, payload);
    return response.data;
  },

  deleteFlashSale: async (id: string): Promise<any> => {
    const response = await axiosClient.delete(`${PREFIX}/${id}`);
    return response.data;
  },
};
