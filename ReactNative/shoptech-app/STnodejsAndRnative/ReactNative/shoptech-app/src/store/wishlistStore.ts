import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

// Định nghĩa interface cho sản phẩm được populate trong Wishlist
export interface ProductInWishlist {
    _id: string;
    name: string;
    price: number;
    images: string[];
    description?: string;
    stock: number;
    [key: string]: any;
}

// Định nghĩa cấu trúc của 1 phần tử trong Wishlist
export interface WishlistItem {
    _id: string;
    user: string;
    product: ProductInWishlist | string;
    createdAt?: string;
    updatedAt?: string;
}

interface WishlistState {
    // Dữ liệu wishlist hiện tại của user
    wishlist: WishlistItem[];
    isLoading: boolean;

    // Các actions gọi API
    fetchWishlist: () => Promise<void>;
    toggleWishlist: (productId: string) => Promise<void>;

    // Helper kiểm tra xem sản phẩm đã có trong wishlist chưa
    isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
    wishlist: [],
    isLoading: false,

    // 1. Lấy danh sách sản phẩm yêu thích (GET /wishlists)
    fetchWishlist: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/wishlists');
            // Xử lý dữ liệu trả về từ axiosClient (đã qua interceptor response.data)
            const data = response.data || response || [];
            set({ wishlist: data, isLoading: false });
        } catch (error) {
            console.log('Lỗi khi lấy danh sách yêu thích:', error);
            set({ wishlist: [], isLoading: false });
        }
    },

    // 2. Thêm hoặc xóa sản phẩm khỏi danh sách yêu thích (POST /wishlists/:productId/toggle)
    toggleWishlist: async (productId: string) => {
        try {
            await axiosClient.post(`/wishlists/${productId}/toggle`);

            // Sau khi thay đổi trạng thái ở Backend, gọi lại fetch để cập nhật state đồng bộ từ DB
            await get().fetchWishlist();
        } catch (error) {
            console.log('Lỗi khi toggle wishlist:', error);
            throw error;
        }
    },

    // 3. Helper kiểm tra xem sản phẩm có ID này đã nằm trong wishlist hay chưa
    isInWishlist: (productId: string) => {
        const { wishlist } = get();
        return wishlist.some((item) => {
            if (!item.product) return false;

            // Kiểm tra xem trường product được populate thành object hay đang giữ dạng string ID
            const itemId = typeof item.product === 'object' && item.product !== null
                ? item.product._id
                : item.product;

            return itemId === productId;
        });
    },
}));
