import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

interface UserState {
    users: any[];
    isLoading: boolean;
    fetchUsers: () => Promise<void>;
    createUser: (userData: any) => Promise<void>;
    changeUserRole: (userId: string, newRole: string) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
    users: [],
    isLoading: false,

    // Lấy danh sách toàn bộ người dùng
    fetchUsers: async () => {
        set({ isLoading: true });
        try {
            const response: any = await axiosClient.get('/users');
            set({ users: response.data || response, isLoading: false });
        } catch (error) {
            console.log('Lỗi lấy danh sách user:', error);
            set({ isLoading: false });
        }
    },

    // Thay đổi quyền của người dùng
    changeUserRole: async (userId, newRole) => {
        try {
            await axiosClient.patch(`/users/${userId}`, { roles: [newRole] });
            await get().fetchUsers();
        } catch (error) {
            console.error("Lỗi cấp quyền:", error);
            throw error;
        }
    },

    // Xóa vĩnh viễn người dùng
    deleteUser: async (userId) => {
        try {
            await axiosClient.delete(`/users/${userId}`);
            get().fetchUsers(); // Tải lại danh sách
        } catch (error) {
            throw error;
        }
    },

    createUser: async (userData) => {
        try {
            // Gọi API POST /users của NestJS (tạo user mà không tự động login)
            await axiosClient.post('/users', userData);
            get().fetchUsers(); // Tải lại danh sách
        } catch (error) {
            throw error;
        }
    },
}));