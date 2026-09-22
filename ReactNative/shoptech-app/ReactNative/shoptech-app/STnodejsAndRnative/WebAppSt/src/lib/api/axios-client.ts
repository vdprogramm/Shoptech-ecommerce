import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL || "https://shoptech-api-ytxj.onrender.com";

export const axiosClient = axios.create({
  baseURL: BASE_URL, // Thiết lập cổng Gateway Backend NestJS chạy tập trung của bạn
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor bảo vệ SSR duy nhất cho toàn bộ hệ thống
axiosClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      let token = localStorage.getItem("accessToken") || localStorage.getItem("token");

      if (!token) {
        const userStorage = localStorage.getItem("user");
        if (userStorage) {
          try {
            const user = JSON.parse(userStorage);
            token = user.accessToken || user.token;
          } catch (e) {
            console.error("Lỗi parse thông tin user từ localStorage:", e);
          }
        }
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default axiosClient;
