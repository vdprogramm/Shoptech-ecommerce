import { create } from 'zustand';
import axiosClient from '../api/axiosClient';
import { useFlashSaleStore } from './flashSaleStore';

interface CartItem {
    id: string; // Bây giờ id này chính là variantId
    productId: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    stock: number;
    originalPrice?: number;
}

interface CartState {
    items: CartItem[];
    isLoading: boolean;
    fetchCart: () => Promise<void>;
    addToCart: (product: any, selectedVariant?: any) => Promise<void>; // Đã thêm param selectedVariant
    removeFromCart: (variantId: string) => Promise<void>;
    updateQuantity: (variantId: string, delta: number) => Promise<void>;
    clearCart: () => void;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    isLoading: false,

    fetchCart: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/carts');
            const backendItems = response.data?.items || response.items || [];
            const currentSale = useFlashSaleStore.getState().currentSale;

            // 🚨 ĐÃ FIX CẤU TRÚC: Backend trả về item.variant lồng item.variant.product
            const mappedItems = backendItems.map((item: any) => {
                const variant = item.variant || {};
                const product = variant.product || {}; // Product gốc nằm bên trong variant

                let displayPrice = variant.price ?? product.price ?? 0;
                let originalPrice: number | undefined = variant.originalPrice;

                return {
                    id: variant._id || item._id, // Dùng variantId làm ID chính trong giỏ
                    productId: product._id,
                    name: product.name || 'Sản phẩm',
                    price: displayPrice,
                    originalPrice: originalPrice,
                    image: variant.image || product.images?.[0] || 'https://via.placeholder.com/150',
                    quantity: item.quantity,
                    stock: variant.stock ?? product.stock ?? 0
                };
            });

            set({ items: mappedItems, isLoading: false });
        } catch (error) {
            console.log('Lỗi tải giỏ hàng:', error);
            set({ isLoading: false });
        }
    },

    addToCart: async (product, selectedVariant = null) => {
        try {
            // 🚨 BỌC GIÁP CHỐNG LỖI UNDEFINED:
            // 1. Ưu tiên lấy ID của biến thể mà khách đã chọn.
            // 2. Nếu khách không chọn (bấm nút ngoài trang chủ), tự động lấy biến thể đầu tiên.
            // 3. Nếu xui quá sản phẩm chả có biến thể nào, lấy tạm ID sản phẩm để không bị crash.
            let targetVariantId = null;

            if (selectedVariant && selectedVariant._id) {
                targetVariantId = selectedVariant._id;
            } else if (product.variants && product.variants.length > 0) {
                targetVariantId = product.variants[0]._id || product.variants[0];
            } else {
                targetVariantId = product._id;
            }

            if (!targetVariantId) {
                console.error("Không tìm thấy ID để thêm vào giỏ!");
                return;
            }

            await axiosClient.post('/carts/add', {
                variantId: targetVariantId, // Đã khớp tên với Backend
                quantity: 1
            });

            get().fetchCart();
        } catch (error) {
            console.error('Lỗi thêm giỏ hàng:', error);
        }
    },

    removeFromCart: async (variantId) => {
        try {
            // Tham số truyền lên bây giờ là variantId
            await axiosClient.delete(`/carts/remove/${variantId}`);
            get().fetchCart();
        } catch (error) {
            console.error('Lỗi xóa sản phẩm:', error);
        }
    },

    updateQuantity: async (variantId, delta) => {
        const currentItem = get().items.find(item => item.id === variantId);
        if (!currentItem) return;

        const newQuantity = Math.max(1, currentItem.quantity + delta);
        
        if (newQuantity > currentItem.stock) {
            return; // Dừng lại nếu vượt quá số lượng tồn kho
        }

        try {
            await axiosClient.patch('/carts/update-quantity', {
                variantId: variantId, // Đã khớp tên với Backend
                quantity: newQuantity
            });
            get().fetchCart();
        } catch (error) {
            console.error('Lỗi cập nhật số lượng:', error);
        }
    },

    clearCart: () => set({ items: [] }),

    getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
    },
}));