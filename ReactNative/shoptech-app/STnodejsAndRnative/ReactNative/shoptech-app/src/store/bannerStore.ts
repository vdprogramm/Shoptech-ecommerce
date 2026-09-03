import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

interface BannerState {
    banners: any[];
    allBanners: any[];
    isLoading: boolean;
    fetchActiveBanners: () => Promise<void>;
    fetchAllBanners: () => Promise<void>; // Lấy cả banner ẩn và hiện
    createBanner: (data: any) => Promise<void>;
    toggleBanner: (id: string, isActive: boolean) => Promise<void>;
}

export const useBannerStore = create<BannerState>((set, get) => ({
    banners: [], // Banner đang hiện (dành cho Home)
    allBanners: [], // Toàn bộ banner (dành cho Admin)
    isLoading: false,

    fetchActiveBanners: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/banners/active');

            // SỬA DÒNG NÀY ĐỂ BẮT DỮ LIỆU BẤT CHẤP CẤU TRÚC BACKEND TRẢ VỀ:
            const bannerData = response.data?.data || response.data || response || [];

            set({ banners: bannerData, isLoading: false });
        } catch (error) {
            console.log('Lỗi tải banner:', error);
            set({ isLoading: false });
        }
    },

    // 1. Lấy toàn bộ danh sách cho Admin
    fetchAllBanners: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/banners'); // Đảm bảo Backend có API GET /banners
            set({ allBanners: response.data || response, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy toàn bộ banner:', error);
            set({ isLoading: false });
        }
    },

    // 2. Tạo Banner mới: @Post()
    createBanner: async (data) => {
        try {
            await axiosClient.post('/banners', data);
            get().fetchAllBanners(); // Tạo xong tải lại
        } catch (error) {
            console.log('Lỗi tạo banner:', error);
            throw error;
        }
    },

    // 3. Bật/Tắt Banner: @Patch(':id/toggle')
    toggleBanner: async (id, isActive) => {
        try {
            await axiosClient.patch(`/banners/${id}/toggle`, { isActive });
            get().fetchAllBanners();
        } catch (error) {
            console.log('Lỗi bật/tắt banner:', error);
            throw error;
        }
    }
}));