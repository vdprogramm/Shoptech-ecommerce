import { axiosClient } from "@/lib/api/axios-client";

export const adminStatsService = {
  async getDashboardStats(storeId?: string) {
    const query = storeId ? `?storeId=${storeId}` : "";
    const response = await axiosClient.get(`/statistics/general${query}`);
    return response.data;
  },

  async getRevenueStats(year?: number, storeId?: string) {
    const currentYear = year || new Date().getFullYear();
    const query = storeId ? `&storeId=${storeId}` : "";
    const response = await axiosClient.get(`/statistics/revenue?year=${currentYear}${query}`);
    return response.data;
  },

  async getTopProducts(year?: number, month?: number) {
    const query = new URLSearchParams();
    if (year) query.append("year", year.toString());
    if (month) query.append("month", month.toString());
    const qs = query.toString();
    const response = await axiosClient.get(`/statistics/top-products${qs ? `?${qs}` : ""}`);
    return response.data;
  },
};

export const apiAdminStats = adminStatsService;
