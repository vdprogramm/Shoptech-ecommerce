import { create } from 'zustand';
import axiosClient from '../api/axiosClient';
import { Alert } from 'react-native';

interface ShippingMethod {
    _id: string;
    name: string;
    baseFee: number;
    estimatedDays: string;
    description?: string;
    isActive: boolean;
}

interface ShippingMethodState {
    shippingMethods: ShippingMethod[];
    isLoading: boolean;
    error: string | null;
    fetchActiveMethods: () => Promise<void>;
}

export const useShippingMethodStore = create<ShippingMethodState>((set) => ({
    shippingMethods: [],
    isLoading: false,
    error: null,

    fetchActiveMethods: async () => {
        set({ isLoading: true, error: null });
        try {
            const response: any = await axiosClient.get('/shipping-methods/active');
            set({ shippingMethods: response || [], isLoading: false });
        } catch (error: any) {
            console.error("Fetch shipping methods error:", error);
            set({ error: error.message || 'Lỗi tải phương thức vận chuyển', isLoading: false });
            Alert.alert('Lỗi', 'Không thể tải danh sách phương thức vận chuyển');
        }
    }
}));
