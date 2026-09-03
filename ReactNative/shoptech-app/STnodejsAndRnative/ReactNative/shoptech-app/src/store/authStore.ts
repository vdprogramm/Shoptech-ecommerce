import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosClient from '../api/axiosClient';
import { useWarrantyStore } from './warrantyStore';

interface AuthState {
    token: string | null;
    user: any | null; // THÊM STATE LƯU USER
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;

    setAuthData: (token: string) => Promise<void>;
    updateUser: (user: any) => Promise<void>;
    register: (fullName: string, email: string, password: string) => Promise<void>;
    verifyOtp: (email: string, otp: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null, // Khởi tạo user = null
    isLoading: true,

    login: async (email, password) => {
        const response: any = await axiosClient.post('/auth/login', { email, password });

        const token = response.token || response.accessToken || response.access_token;
        const userData = response.user || response.data?.user || response;

        await AsyncStorage.setItem('accessToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));

        set({ token, user: userData, isLoading: false });
    },


    setAuthData: async (token) => {
        // Lấy user info từ token hoặc `/users/me` API. Do chưa có API /users/me sẵn, tạm thời lưu token trước.
        await AsyncStorage.setItem('accessToken', token);
        // Có thể cần fetch dữ liệu user nếu cần
        set({ token, isLoading: false });
    },

    updateUser: async (user) => {
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        set({ user });
    },

    register: async (fullName, email, password) => {
        await axiosClient.post('/users/register', { fullName, email, password });
    },

    verifyOtp: async (email, otp) => {
        await axiosClient.post('/auth/verify', { email, otp });
    },

    logout: async () => {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('userData'); // Xóa luôn user khi đăng xuất
        useWarrantyStore.getState().clearWarranties();
        set({ token: null, user: null, isLoading: false });
    },

    checkAuth: async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const userString = await AsyncStorage.getItem('userData');
            const user = userString ? JSON.parse(userString) : null;

            set({ token: token || null, user: user, isLoading: false });
        } catch (e) {
            set({ isLoading: false });
        }
    },
}));