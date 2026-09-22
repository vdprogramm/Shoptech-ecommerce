import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Đã đổi sang link server thật trên Render để chạy trên điện thoại thật
export const BASE_URL = 'https://shoptech-api-ytxj.onrender.com';

const axiosClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error.response?.data || error)
);

export default axiosClient;