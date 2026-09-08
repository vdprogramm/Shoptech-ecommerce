import axios from "axios";

const cartApi = axios.create({
  baseURL: "https://shoptech-api-ytxj.onrender.com/carts",
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động đính Token vào Header cho mỗi lượt gọi API giỏ hàng
cartApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken"); // Hoặc nơi bạn lưu JWT Token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Định nghĩa Interface khớp chuẩn cấu trúc DB NestJS của bạn
export interface CartItem {
  variant: {
    _id: string;
    name: string; // Ví dụ: "iPhone 15 Pro Max - 256GB - Màu Titan"
    price: number;
    images?: string[];
    stock: number;
    product?: string; // ID của sản phẩm gốc nếu cần
  };
  quantity: number;
}

export interface CartData {
  _id: string;
  user: string;
  items: CartItem[];
}

export const cartService = {
  // Lấy toàn bộ giỏ hàng từ DB của User đang đăng nhập
  getCart: async (): Promise<CartData | null> => {
    try {
      const response = await cartApi.get("/");
      return response.data;
    } catch (error) {
      console.error("Chưa đăng nhập hoặc token hết hạn", error);
      return null;
    }
  },

  addToCart: async (variantId: string, quantity: number = 1) => {
    const response = await cartApi.post("/add", { variantId, quantity });
    window.dispatchEvent(new Event("cartUpdate"));
    return response.data;
  },

  // Gọi cổng @Patch('update-quantity')
  updateQuantity: async (variantId: string, quantity: number) => {
    const response = await cartApi.patch("/update-quantity", { variantId, quantity });
    return response.data;
  },

  // Gọi cổng @Delete('remove/:variantId')
  removeItem: async (variantId: string) => {
    const response = await cartApi.delete(`/remove/${variantId}`);
    window.dispatchEvent(new Event("cartUpdate"));
    return response.data;
  },
};
