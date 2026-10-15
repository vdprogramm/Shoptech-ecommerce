import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

// Định nghĩa interface cho Voucher
export interface Voucher {
    _id: string;
    code: string;
    discountAmount: number;
    discountType: 'fixed' | 'percent';
    minOrderValue: number;
    expirationDate: string;
    usageLimit: number;
    usedCount: number;
    isActive: boolean;
    store?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface VoucherState {
    vouchers: Voucher[]; // Danh sách mã voucher công khai
    allVouchers: Voucher[]; // Toàn bộ voucher cho Admin
    appliedVoucher: Voucher | null; // Voucher đang được áp dụng
    discountAmount: number; // Số tiền được giảm cho đơn hàng hiện tại
    isLoading: boolean;

    // Các actions gọi API
    fetchPublicVouchers: () => Promise<void>;
    fetchAllVouchers: () => Promise<void>;
    createVoucher: (voucherData: any) => Promise<void>;
    validateAndApplyVoucher: (code: string, orderTotal: number, storeSubtotals?: Record<string, number>) => Promise<{ success: boolean; message: string }>;
    removeAppliedVoucher: () => void;
}

export const useVoucherStore = create<VoucherState>((set, get) => ({
    vouchers: [],
    allVouchers: [],
    appliedVoucher: null,
    discountAmount: 0,
    isLoading: false,

    // 1. Lấy danh sách Voucher công khai cho khách hàng chọn (GET /vouchers/public-list)
    fetchPublicVouchers: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/vouchers/public-list');
            const data = response.data || response || [];
            set({ vouchers: data, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy danh sách voucher công khai:', error);
            set({ vouchers: [], isLoading: false });
        }
    },

    // 2. Lấy toàn bộ Voucher cho trang Admin (GET /vouchers)
    fetchAllVouchers: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/vouchers');
            const data = response.data || response || [];
            set({ allVouchers: data, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy danh sách voucher Admin:', error);
            set({ allVouchers: [], isLoading: false });
        }
    },

    // 3. Admin tạo Voucher mới (POST /vouchers)
    createVoucher: async (voucherData: any) => {
        try {
            await axiosClient.post('/vouchers', voucherData);
            await get().fetchAllVouchers(); // Tải lại danh sách
        } catch (error) {
            console.log('Lỗi tạo voucher mới:', error);
            throw error;
        }
    },

    // 4. Kiểm tra mã giảm giá và áp dụng (POST /vouchers/check)
    validateAndApplyVoucher: async (code: string, orderTotal: number, storeSubtotals?: Record<string, number>) => {
        try {
            // Gửi code lên backend kiểm tra tính hợp lệ và lấy thông tin giảm giá
            const response: any = await axiosClient.post('/vouchers/check', { code, orderTotal, storeSubtotals });
            const result = response.data || response;

            if (result && (result.isValid || result.voucherId)) {
                set({
                    appliedVoucher: { code: result.code, _id: result.voucherId } as Voucher,
                    discountAmount: result.discountValue || 0
                });

                return { success: true, message: `Áp dụng thành công voucher ${result.code}` };
            }

            return { success: false, message: 'Mã không hợp lệ' };
        } catch (error: any) {
            console.log('Lỗi áp dụng voucher:', error);
            // reset applied voucher if validation failed
            set({ appliedVoucher: null, discountAmount: 0 });
            return {
                success: false,
                message: error.message || 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện sử dụng'
            };
        }
    },

    // 5. Gỡ voucher đang áp dụng
    removeAppliedVoucher: () => {
        set({ appliedVoucher: null, discountAmount: 0 });
    }
}));
