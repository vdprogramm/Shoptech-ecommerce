import { create } from 'zustand';
import axiosClient from '../api/axiosClient';
import { useProductStore } from './productStore';

// Định nghĩa interface cho các phần tử trong Flash Sale
export interface FlashSaleItem {
    variant: {
        _id: string;
        sku?: string;
        price: number;
        stock: number;
        product?: {
            _id: string;
            name: string;
            images: string[];
            [key: string]: any;
        } | any;
        [key: string]: any;
    } | any; // Đối tượng Variant đã được populate kèm theo Product thông tin
    salePrice: number;
    quantityLimit: number;
    soldCount: number;
}

// Định nghĩa interface cho Chiến dịch Flash Sale
export interface FlashSale {
    _id: string;
    campaignName: string;
    startTime: string;
    endTime: string;
    items: FlashSaleItem[];
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface FlashSaleState {
    currentSale: FlashSale | null;
    activeSales: FlashSale[];
    allSales: FlashSale[];
    isLoading: boolean;
    productFlashSale: any | null; // Flash sale của riêng 1 sản phẩm khi xem chi tiết

    // Các actions gọi API
    fetchCurrentSale: () => Promise<void>;
    fetchAllSales: () => Promise<void>;
    createCampaign: (campaignData: any) => Promise<void>;
    fetchProductFlashSale: (productId: string) => Promise<void>;
}

export const useFlashSaleStore = create<FlashSaleState>((set, get) => ({
    currentSale: null,
    activeSales: [],
    allSales: [],
    isLoading: false,
    productFlashSale: null,

    fetchCurrentSale: async () => {
        set({ isLoading: true });
        try {
            // Thay vì gọi /flash-sales/current (chỉ trả về 1 cái), ta gọi /flash-sales để lấy tất cả
            const response: any = await axiosClient.get('/flash-sales');
            const data = response.data || response || [];
            
            const now = new Date().getTime();
            const activeCampaigns = data.filter((c: any) => c.isActive && new Date(c.endTime).getTime() > now);

            if (activeCampaigns.length > 0) {
                const allProducts = useProductStore.getState().products || [];
                
                // Process each active campaign separately for activeSales
                const processedCampaigns = activeCampaigns.map((campaign: any) => {
                    let items = [...campaign.items];
                    items.forEach((item: any) => {
                        if (typeof item.variant === 'string' || !item.variant?.product) {
                            const variantId = typeof item.variant === 'string' ? item.variant : item.variant?._id;
                            let foundProduct = null;
                            let foundVariant = null;
                            
                            for (const p of allProducts) {
                                if (p.variants && Array.isArray(p.variants)) {
                                    const v = p.variants.find((v: any) => (v._id || v) === variantId);
                                    if (v) {
                                        foundProduct = p;
                                        foundVariant = v;
                                        break;
                                    }
                                }
                            }
                            
                            if (foundProduct && foundVariant) {
                                item.variant = {
                                    _id: variantId,
                                    price: foundVariant.price,
                                    attributes: foundVariant.attributes,
                                    product: foundProduct
                                };
                            }
                        }
                    });
                    return {
                        ...campaign,
                        items: items.filter((item: any) => item.variant && item.variant.product)
                    };
                });

                // Xử lý merged items cho currentSale (tương thích ngược)
                let mergedItems = processedCampaigns.flatMap((c: any) => c.items);

                const minEndTime = activeCampaigns.reduce((min: number, c: any) => {
                    const current = new Date(c.endTime).getTime();
                    return current < min ? current : min;
                }, new Date(activeCampaigns[0].endTime).getTime());

                const campaignName = activeCampaigns.length > 1 ? 'Săn Deal Khủng' : activeCampaigns[0].campaignName;

                set({ 
                    currentSale: {
                        _id: activeCampaigns[0]._id,
                        campaignName,
                        startTime: activeCampaigns[0].startTime,
                        endTime: new Date(minEndTime).toISOString(),
                        items: mergedItems,
                        isActive: true
                    },
                    activeSales: processedCampaigns,
                    isLoading: false 
                });
            } else {
                set({ currentSale: null, activeSales: [], isLoading: false });
            }
        } catch (error) {
            console.log('Lỗi lấy chiến dịch flash sale hiện tại:', error);
            set({ currentSale: null, activeSales: [], isLoading: false });
        }
    },

    // 2. Lấy danh sách toàn bộ chiến dịch (cho trang quản trị hoặc danh sách lịch sử) (GET /flash-sales)
    fetchAllSales: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/flash-sales');
            const data = response.data || response || [];
            set({ allSales: data, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy toàn bộ danh sách flash sale:', error);
            set({ allSales: [], isLoading: false });
        }
    },

    // 3. Admin tạo một chiến dịch flash sale mới (POST /flash-sales)
    createCampaign: async (campaignData: any) => {
        try {
            await axiosClient.post('/flash-sales', campaignData);
            await get().fetchAllSales(); // Refresh lại danh sách
        } catch (error) {
            console.log('Lỗi tạo chiến dịch flash sale mới:', error);
            throw error;
        }
    },

    // 4. Lấy thông tin flash sale theo ID sản phẩm gốc (dùng ở trang chi tiết sản phẩm) (GET /flash-sales/product/:id)
    fetchProductFlashSale: async (productId: string) => {
        try {
            const response: any = await axiosClient.get(`/flash-sales/product/${productId}`);
            const data = response.data || response;
            set({ productFlashSale: data || null });
        } catch (error) {
            console.log('Lỗi lấy flash sale của sản phẩm:', error);
            set({ productFlashSale: null });
        }
    },
}));
