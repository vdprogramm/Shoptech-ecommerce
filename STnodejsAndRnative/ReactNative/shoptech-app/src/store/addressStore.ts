import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

interface AddressState {
    addresses: any[];
    isLoading: boolean;
    fetchAddresses: () => Promise<void>;
    addAddress: (addressData: any) => Promise<boolean>;
    updateAddress: (id: string, addressData: any) => Promise<boolean>;
    deleteAddress: (id: string) => Promise<boolean>;
}

export const useAddressStore = create<AddressState>((set, get) => ({
    addresses: [],
    isLoading: false,

    fetchAddresses: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/addresses');
            set({ addresses: response.data || response, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
        }
    },
    addAddress: async (addressData) => {
        try {
            // Gọi API POST /addresses xuống Backend NestJS
            await axiosClient.post('/addresses', addressData);
            get().fetchAddresses();
            return true;
        } catch (error) {
            console.error('Lỗi thêm địa chỉ:', error);
            return false;
        }
    },

    updateAddress: async (id, addressData) => {
        try {
            await axiosClient.put(`/addresses/${id}`, addressData);
            get().fetchAddresses(); // Cập nhật xong tải lại danh sách
            return true;
        } catch (error) {
            console.error('Lỗi cập nhật địa chỉ:', error);
            return false;
        }
    },

    deleteAddress: async (id) => {
        try {
            await axiosClient.delete(`/addresses/${id}`);
            get().fetchAddresses(); // Xóa xong tải lại danh sách
            return true;
        } catch (error) {
            console.error('Lỗi xóa địa chỉ:', error);
            return false;
        }
    }
}));