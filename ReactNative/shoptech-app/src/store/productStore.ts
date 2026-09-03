import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

interface ProductState {
    // Dữ liệu
    products: any[];
    categories: any[];
    brands: any[];

    // Trạng thái Loading
    isLoadingProducts: boolean;
    isLoadingForm: boolean;
    isSubmitting: boolean;

    // Hành động (Actions)
    fetchProducts: () => Promise<void>;
    fetchCategoriesAndBrands: () => Promise<void>;
    createProduct: (productData: any, imageUri: string | null) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    updateProduct: (id: string, productData: any, imageUri: string | null) => Promise<void>;
    createCategory: (name: string) => Promise<void>;
    createBrand: (name: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    categories: [],
    brands: [],

    isLoadingProducts: false,
    isLoadingForm: false,
    isSubmitting: false,

    // 1. Lấy danh sách sản phẩm (Dùng cho Trang chủ)
    fetchProducts: async () => {
        set({ isLoadingProducts: true });
        try {
            const response: any = await axiosClient.get('/products');
            const productList = response.data || response;
            set({ products: productList, isLoadingProducts: false });
        } catch (error) {
            console.log('Lỗi lấy sản phẩm:', error);
            set({ isLoadingProducts: false });
        }
    },

    // 2. Lấy Danh mục & Thương hiệu (Dùng cho Form Admin)
    fetchCategoriesAndBrands: async () => {
        set({ isLoadingForm: true });
        try {
            const [catsRes, brandsRes]: any = await Promise.all([
                axiosClient.get('/categories'),
                axiosClient.get('/brands')
            ]);

            set({
                categories: catsRes.data || catsRes,
                brands: brandsRes.data || brandsRes,
                isLoadingForm: false
            });
        } catch (error) {
            set({ isLoadingForm: false });
            throw error; // Ném lỗi ra để Screen bắt và hiển thị Alert
        }
    },

    // 3. Xử lý logic Upload Ảnh và Tạo Sản phẩm mới
    createProduct: async (productData, imageUri) => {
        set({ isSubmitting: true });
        try {
            let finalImageUrl = 'https://via.placeholder.com/400';

            // Xử lý Upload Ảnh nếu có
            if (imageUri) {
                const formData = new FormData();
                const filename = imageUri.split('/').pop() || 'upload.jpg';
                const match = /\.(\w+)$/.exec(filename);
                let type = match ? `image/${match[1]}` : `image/jpeg`;
                if (type === 'image/jpg') type = 'image/jpeg';

                formData.append('file', {
                    uri: imageUri,
                    name: filename,
                    type: type,
                } as any);

                const uploadRes: any = await axiosClient.post('/files/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    transformRequest: () => formData, // Quan trọng: Bắt buộc Axios gửi nguyên FormData trong RN
                });

                const BASE_URL = 'http://10.0.2.2:3001';
                finalImageUrl = BASE_URL + uploadRes.path;
            }

            // Ghép ảnh vào data và gọi API tạo
            const newProduct = { ...productData, images: [finalImageUrl] };
            await axiosClient.post('/products', newProduct);

            // (Tùy chọn) Reload lại danh sách sản phẩm cho mới
            get().fetchProducts();

            set({ isSubmitting: false });
        } catch (error) {
            set({ isSubmitting: false });
            throw error; // Ném lỗi ra để Screen bắt
        }
    },

    // 4. Xóa sản phẩm
    deleteProduct: async (id) => {
        try {
            await axiosClient.delete(`/products/${id}`);
            // Lọc bỏ sản phẩm bị xóa khỏi mảng products hiện tại trên UI để nó biến mất ngay lập tức
            set({ products: get().products.filter((p) => p._id !== id) });
        } catch (error) {
            throw error;
        }
    },

    // 4. HÀM CẬP NHẬT SẢN PHẨM
    updateProduct: async (id, productData, imageUri) => {
        set({ isSubmitting: true });
        try {
            let finalImageUrl = imageUri; // Mặc định giữ nguyên link ảnh cũ

            // CHỈ upload lại ảnh NẾU người dùng chọn ảnh mới từ điện thoại (link có chữ file://)
            if (imageUri && !imageUri.startsWith('http')) {
                const formData = new FormData();
                const filename = imageUri.split('/').pop() || 'upload.jpg';
                const match = /\.(\w+)$/.exec(filename);
                let type = match ? `image/${match[1]}` : `image/jpeg`;
                if (type === 'image/jpg') type = 'image/jpeg';

                formData.append('file', { uri: imageUri, name: filename, type } as any);

                const uploadRes: any = await axiosClient.post('/files/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    transformRequest: () => formData,
                });

                const BASE_URL = 'http://10.0.2.2:3001';
                finalImageUrl = BASE_URL + uploadRes.path;
            }

            // Gắn link ảnh (cũ hoặc mới) vào data để gửi đi
            const updateData = { ...productData, images: [finalImageUrl] };

            // Gọi API Patch mà chúng ta vừa viết ở Backend
            await axiosClient.patch(`/products/${id}`, updateData);

            // Cập nhật xong thì bắt Store tải lại danh sách mới nhất
            get().fetchProducts();

            set({ isSubmitting: false });
        } catch (error) {
            set({ isSubmitting: false });
            throw error;
        }
    },

    // 5. TẠO DANH MỤC MỚI
    createCategory: async (name) => {
        try {
            await axiosClient.post('/categories', { name });
            get().fetchCategoriesAndBrands(); // Tạo xong thì tải lại danh sách cho mới
        } catch (error) {
            throw error;
        }
    },

    // 6. TẠO THƯƠNG HIỆU MỚI
    createBrand: async (name) => {
        try {
            await axiosClient.post('/brands', { name });
            get().fetchCategoriesAndBrands(); // Tạo xong thì tải lại danh sách cho mới
        } catch (error) {
            throw error;
        }
    },
}));