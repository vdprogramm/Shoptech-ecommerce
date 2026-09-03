import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

interface OrderState {
    orders: any[];
    shipperAvailableOrders: any[];
    shipperHistoryOrders: any[];
    shipperOngoingOrders: any[];
    storeOrders: any[];
    adminAllOrders: any[];
    isLoading: boolean;

    // Khách hàng
    fetchMyOrders: (status?: string) => Promise<void>;
    createOrder: (orderData: any) => Promise<any>;
    cancelOrder: (orderId: string) => Promise<boolean>;
    fetchOrderById: (id: string) => Promise<any>;

    // Shipper
    fetchShipperAvailableOrders: () => Promise<void>;
    updateShipperOrderStatus: (subOrderId: string, status: string, proofImage?: string) => Promise<boolean>;
    fetchShipperHistory: () => Promise<void>;

    // Merchant (Store)
    fetchMyStoreOrders: () => Promise<void>;
    updateMerchantOrderStatus: (orderId: string, status: string) => Promise<boolean>;

    // Admin
    fetchAllAdminOrders: () => Promise<void>;
}

export const useOrderStore = create<OrderState>((set) => ({
    orders: [],
    shipperAvailableOrders: [],
    shipperHistoryOrders: [],
    shipperOngoingOrders: [],
    storeOrders: [],
    adminAllOrders: [],
    isLoading: false,

    // --- KHÁCH HÀNG ---
    fetchMyOrders: async (status?: string) => {
        set({ isLoading: true });
        try {
            const endpoint = status && status !== 'ALL'
                ? `/orders/my-orders?status=${status}`
                : '/orders/my-orders';
            const response: any = await axiosClient.get(endpoint);
            set({ orders: response.data || response, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy đơn hàng:', error);
            set({ isLoading: false });
        }
    },

    createOrder: async (orderData) => {
        try {
            const response: any = await axiosClient.post('/orders', orderData);
            return response.data || response;
        } catch (error) {
            console.error('Lỗi tạo đơn hàng:', error);
            return null;
        }
    },

    cancelOrder: async (orderId: string) => {
        try {
            await axiosClient.put(`/orders/${orderId}/cancel`);
            return true;
        } catch (error) {
            console.error('Lỗi hủy đơn hàng:', error);
            return false;
        }
    },

    fetchOrderById: async (id: string) => {
        try {
            const response: any = await axiosClient.get(`/orders/${id}`);
            return response.data || response;
        } catch (error) {
            console.error('Lỗi lấy chi tiết đơn hàng:', error);
            return null;
        }
    },

    // --- SHIPPER ---
    fetchShipperAvailableOrders: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/orders/shipper/available');
            set({ shipperAvailableOrders: response.data || response, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy đơn hàng cho shipper:', error);
            set({ isLoading: false });
        }
    },

    updateShipperOrderStatus: async (subOrderId: string, status: string, proofImage?: string) => {
        try {
            await axiosClient.patch('/orders/shipper/update-status', { subOrderId, status, proofImage });
            return true;
        } catch (error: any) {
            // Đã đổi console.error thành console.log
            console.log('Lỗi Shipper cập nhật trạng thái:', error.response?.data || error.message);
            return false;
        }
    },

    fetchShipperHistory: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/orders/shipper/history');
            set({ shipperHistoryOrders: response.data || response, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy lịch sử giao hàng:', error);
            set({ isLoading: false });
        }
    },

    // --- MERCHANT ---
    fetchMyStoreOrders: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/orders/store/my-orders');
            set({ storeOrders: response.data || response, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy đơn hàng của shop:', error);
            set({ isLoading: false });
        }
    },

    updateMerchantOrderStatus: async (orderId: string, status: string) => {
        try {
            await axiosClient.patch(`/orders/merchant/${orderId}/status`, { status });
            return true;
        } catch (error) {
            console.error('Lỗi Shop cập nhật trạng thái:', error);
            return false;
        }
    },

    // --- ADMIN ---
    fetchAllAdminOrders: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/orders/admin/all');
            set({ adminAllOrders: response.data || response, isLoading: false });
        } catch (error) {
            console.log('Lỗi Admin lấy tất cả đơn hàng:', error);
            set({ isLoading: false });
        }
    },

    fetchShipperOngoingOrders: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/orders/shipper/ongoing');
            set({ shipperOngoingOrders: response.data || response, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy đơn hàng đang giao của shipper:', error);
            set({ isLoading: false });
        }
    },
}));