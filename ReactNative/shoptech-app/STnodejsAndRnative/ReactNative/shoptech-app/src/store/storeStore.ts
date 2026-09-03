import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

export interface Store {
    _id: string;
    name: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
    isActive: boolean;
    managerId: string;
    createdAt?: string;
    updatedAt?: string;
}

interface StoreState {
    stores: Store[];
    selectedStore: Store | null;
    isLoading: boolean;

    fetchAllStores: () => Promise<void>;
    fetchStoreById: (id: string) => Promise<void>;
    fetchStoresByManager: (managerId: string) => Promise<void>;
    createStore: (data: Partial<Store>) => Promise<void>;
    updateStore: (id: string, data: Partial<Store>) => Promise<void>;
    deleteStore: (id: string) => Promise<void>;
}

export const useStoreStore = create<StoreState>((set, get) => ({
    stores: [],
    selectedStore: null,
    isLoading: false,

    // 1. Lấy toàn bộ danh sách cửa hàng (GET /stores)
    fetchAllStores: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/stores');
            const data = response.data || response || [];
            set({ stores: data, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy danh sách cửa hàng:', error);
            set({ stores: [], isLoading: false });
        }
    },

    // 2. Lấy chi tiết 1 cửa hàng (GET /stores/:id)
    fetchStoreById: async (id: string) => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get(`/stores/${id}`);
            const data = response.data || response;
            set({ selectedStore: data, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy chi tiết cửa hàng:', error);
            set({ isLoading: false });
        }
    },

    // 3. Lấy danh sách cửa hàng theo manager (GET /stores/manager/:managerId)
    fetchStoresByManager: async (managerId: string) => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get(`/stores/manager/${managerId}`);
            const data = response.data || response || [];
            set({ stores: data, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy cửa hàng theo manager:', error);
            set({ stores: [], isLoading: false });
        }
    },

    // 4. Tạo cửa hàng mới (POST /stores)
    createStore: async (data: Partial<Store>) => {
        try {
            await axiosClient.post('/stores', data);
            await get().fetchAllStores();
        } catch (error) {
            console.log('Lỗi tạo cửa hàng:', error);
            throw error;
        }
    },

    // 5. Cập nhật thông tin cửa hàng (PATCH /stores/:id)
    updateStore: async (id: string, data: Partial<Store>) => {
        try {
            await axiosClient.patch(`/stores/${id}`, data);
            await get().fetchAllStores();
        } catch (error) {
            console.log('Lỗi cập nhật cửa hàng:', error);
            throw error;
        }
    },

    // 6. Xóa cửa hàng (DELETE /stores/:id)
    deleteStore: async (id: string) => {
        try {
            await axiosClient.delete(`/stores/${id}`);
            set((state) => ({
                stores: state.stores.filter((s) => s._id !== id),
            }));
        } catch (error) {
            console.log('Lỗi xóa cửa hàng:', error);
            throw error;
        }
    },
}));
