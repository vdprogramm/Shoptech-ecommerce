import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

export interface Warranty {
    _id: string;
    user: string | any;
    order: string | any;
    product: {
        _id: string;
        name: string;
    } | any;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
}

interface WarrantyState {
    myWarranties: Warranty[];
    isLoading: boolean;

    fetchMyWarranties: () => Promise<void>;
    clearWarranties: () => void;
}

export const useWarrantyStore = create<WarrantyState>((set) => ({
    myWarranties: [],
    isLoading: false,

    fetchMyWarranties: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/warranties/my-warranties');
            const data = response.data || response || [];
            set({ myWarranties: data, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy danh sách bảo hành:', error);
            set({ myWarranties: [], isLoading: false });
        }
    },

    clearWarranties: () => set({ myWarranties: [] }),
}));
