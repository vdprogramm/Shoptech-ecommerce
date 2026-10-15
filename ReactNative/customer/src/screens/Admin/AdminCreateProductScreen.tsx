import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useProductStore } from '../../store/productStore';

export default function AdminCreateProductScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();

    const editingProduct = route.params?.product;
    const isEditMode = !!editingProduct;

    const {
        categories, brands,
        isLoadingForm, isSubmitting,
        fetchCategoriesAndBrands, createProduct, updateProduct
    } = useProductStore();

    const [name, setName] = useState(editingProduct?.name || '');
    const [description, setDescription] = useState(editingProduct?.description || '');
    const [selectedCategory, setSelectedCategory] = useState(editingProduct?.category?._id || editingProduct?.category || '');
    const [selectedBrand, setSelectedBrand] = useState(editingProduct?.brand?._id || editingProduct?.brand || '');
    const [imageUri, setImageUri] = useState<string | null>(editingProduct?.images?.[0] || null);

    const [variants, setVariants] = useState<any[]>(
        editingProduct?.variants && editingProduct.variants.length > 0
            ? editingProduct.variants
            : [{ sku: 'Bản chuẩn', price: '', stock: '' }]
    );

    useEffect(() => {
        fetchCategoriesAndBrands().then(() => {
            if (!isEditMode) {
                if (categories.length > 0 && !selectedCategory) setSelectedCategory(categories[0]._id);
                if (brands.length > 0 && !selectedBrand) setSelectedBrand(brands[0]._id);
            }
        });
    }, [categories.length, brands.length]);

    // Hàm thêm một ô nhập biến thể mới
    const addVariantField = () => {
        setVariants([...variants, { sku: '', price: '', stock: '' }]);
    };

    // Hàm xóa một biến thể khỏi danh sách
    const removeVariantField = (index: number) => {
        if (variants.length === 1) {
            Alert.alert("Lưu ý", "Sản phẩm phải có ít nhất một phiên bản.");
            return;
        }
        const newVariants = [...variants];
        newVariants.splice(index, 1);
        setVariants(newVariants);
    };

    // Hàm cập nhật giá trị trong từng ô biến thể
    const updateVariant = (index: number, field: string, value: string) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const handleSubmit = async () => {
        // Kiểm tra thông tin cơ bản
        if (!name || !selectedCategory || !selectedBrand || variants.some(v => !v.sku || !v.price)) {
            Alert.alert('Lỗi', 'Vui lòng điền đủ tên sản phẩm và thông tin các phiên bản!');
            return;
        }

        try {
            // Đóng gói dữ liệu bao gồm mảng variants
            const productData = {
                name,
                description,
                category: selectedCategory,
                brand: selectedBrand,
                variants: variants.map(v => ({
                    ...v,
                    price: Number(v.price),
                    stock: Number(v.stock)
                }))
            };

            if (isEditMode) {
                await updateProduct(editingProduct._id, productData, imageUri);
                Alert.alert('Thành công', 'Cập nhật thành công!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            } else {
                await createProduct(productData, imageUri);
                Alert.alert('Thành công', 'Đã thêm sản phẩm và các biến thể!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            }
        } catch (error: any) {
            const errorMessage = Array.isArray(error?.message) ? error.message.join('\n') : (error?.message || 'Có lỗi xảy ra');
            Alert.alert('Thông báo', errorMessage);
        }
    };

    if (isLoadingForm) {
        return <View style={styles.loading}><ActivityIndicator size="large" color="#dc3545" /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={28} color="#fff" /></TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditMode ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                {/* Chọn ảnh */}
                <Text style={styles.label}>Ảnh sản phẩm</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : (
                        <View style={styles.placeholderBox}>
                            <Ionicons name="camera-outline" size={40} color="#999" />
                            <Text style={{ color: '#999' }}>Bấm chọn ảnh</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={styles.label}>Tên sản phẩm</Text>
                <TextInput style={styles.input} placeholder="VD: iPhone 15 Pro Max" value={name} onChangeText={setName} />

                {/* 🚨 QUẢN LÝ BIẾN THỂ (PHẦN QUAN TRỌNG NHẤT) */}
                <View style={styles.variantHeader}>
                    <Text style={styles.label}>Các phiên bản (Màu sắc, Dung lượng...)</Text>
                    <TouchableOpacity onPress={addVariantField}>
                        <Ionicons name="add-circle" size={28} color="#28a745" />
                    </TouchableOpacity>
                </View>

                {variants.map((variant, index) => (
                    <View key={index} style={styles.variantCard}>
                        <View style={styles.variantRow}>
                            <TextInput
                                style={[styles.input, { flex: 2 }]}
                                placeholder="Tên phiên bản (Đen 256GB)"
                                value={variant.sku}
                                onChangeText={(v) => updateVariant(index, 'sku', v)}
                            />
                            <TouchableOpacity onPress={() => removeVariantField(index)}>
                                <Ionicons name="trash-outline" size={24} color="#dc3545" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.variantRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginRight: 5 }]}
                                placeholder="Giá tiền"
                                value={variant.price.toString()}
                                keyboardType="numeric"
                                onChangeText={(v) => updateVariant(index, 'price', v)}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1, marginLeft: 5 }]}
                                placeholder="Kho"
                                value={variant.stock.toString()}
                                keyboardType="numeric"
                                onChangeText={(v) => updateVariant(index, 'stock', v)}
                            />
                        </View>
                    </View>
                ))}

                {/* Danh mục & Thương hiệu (Giữ nguyên) */}
                <Text style={styles.label}>Danh mục</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
                    {categories.map((cat) => (
                        <TouchableOpacity key={cat._id} style={[styles.badge, selectedCategory === cat._id && styles.badgeActive]} onPress={() => setSelectedCategory(cat._id)}>
                            <Text style={[styles.badgeText, selectedCategory === cat._id && styles.badgeTextActive]}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.label}>Thương hiệu</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
                    {brands.map((b) => (
                        <TouchableOpacity key={b._id} style={[styles.badge, selectedBrand === b._id && styles.badgeActive]} onPress={() => setSelectedBrand(b._id)}>
                            <Text style={[styles.badgeText, selectedBrand === b._id && styles.badgeTextActive]}>{b.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.label}>Mô tả chi tiết</Text>
                <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{isEditMode ? 'CẬP NHẬT' : 'LƯU SẢN PHẨM'}</Text>}
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: '#dc3545', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    formContainer: { padding: 20 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, fontSize: 15 },
    textArea: { height: 100 },
    imagePicker: { backgroundColor: '#e9ecef', height: 180, borderRadius: 15, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholderBox: { alignItems: 'center' },
    variantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    variantCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#eee', elevation: 2 },
    variantRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    selectorRow: { flexDirection: 'row', marginBottom: 10 },
    badge: { backgroundColor: '#e0e0e0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
    badgeActive: { backgroundColor: '#dc3545' },
    badgeText: { color: '#333', fontWeight: 'bold' },
    badgeTextActive: { color: '#fff' },
    submitButton: { backgroundColor: '#dc3545', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});