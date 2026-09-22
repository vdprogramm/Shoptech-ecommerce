import axios from "axios";

// Sử dụng biến môi trường chuẩn của Vite
const API_URL = import.meta.env.VITE_API_URL || "https://shoptech-api-ytxj.onrender.com";

const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authService = {
  login: async (loginDto: Record<string, any>) => {
    const response = await authApi.post("/auth/login", loginDto);
    return response.data;
  },

  register: async (registerDto: Record<string, any>) => {
    const response = await authApi.post("/users/register", registerDto);
    return response.data;
  },

  googleLogin: async (token: string) => {
    const response = await authApi.post("/auth/google", { token });
    return response.data;
  },

  verifyEmail: async (email: string, otp: string) => {
    const response = await authApi.post("/users/verify-email", { email, otp });
    return response.data;
  },

  // 🛡️ TỐI ƯU SSR TRIỆT ĐỂ: Tránh lỗi chuyển hướng nhầm trên Server
  getCurrentUser: () => {
    if (typeof window === "undefined") {
      // Khi ở Server, trả về một Admin giả lập chứa đầy đủ mọi Roles
      // để lọt qua tất cả các bộ lọc phân quyền của Route Guard trên Server
      return { roles: ["ADMIN", "STORE_OWNER", "STORE_STAFF"], fullName: "Admin SSR" };
    }

    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // 🛡️ TỐI ƯU SSR TRIỆT ĐỂ: Tạm thời mở cửa trên Server, Trình duyệt sẽ check thật
  isAuthenticated: () => {
    if (typeof window === "undefined") {
      // Luôn trả về true trên Server để không bị ép nhảy sang trang /login một cách vô lý
      return true;
    }

    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    return !!token && !!localStorage.getItem("user");
  },

  logout: () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    // Dùng authApi thay vì axios gán cứng localhost
    const response = await authApi.post("/auth/forgot-password", { email });
    return response.data;
  },

  async resetPassword(token: string, passwordMoi: string): Promise<{ message: string }> {
    // Dùng authApi thay vì axios gán cứng localhost
    const response = await authApi.post("/auth/reset-password", {
      token,
      passwordMoi,
    });
    return response.data;
  },

  updateProfile: async (updateData: Record<string, any>) => {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    const response = await authApi.patch("/users/profile/update", updateData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
