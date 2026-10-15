import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

export interface News {
    _id: string;
    title: string;
    excerpt: string;
    content: string;
    imageUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

interface NewsState {
    newsList: News[];
    selectedNews: News | null;
    isLoading: boolean;

    fetchAllNews: () => Promise<void>;
    setSelectedNews: (news: News) => void;
}

export const useNewsStore = create<NewsState>((set) => ({
    newsList: [],
    selectedNews: null,
    isLoading: false,

    // 1. Lấy toàn bộ danh sách bài viết (GET /news)
    fetchAllNews: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/news');
            const data: News[] = response.data || response || [];
            // Chỉ hiển thị bài viết đang kích hoạt cho khách hàng
            const activeNews = data.filter((n) => n.isActive);
            set({ newsList: activeNews, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy danh sách tin tức:', error);
            set({ newsList: [], isLoading: false });
        }
    },

    // 2. Lưu bài viết đang xem vào store (không gọi API thêm)
    setSelectedNews: (news: News) => {
        set({ selectedNews: news });
    },
}));
