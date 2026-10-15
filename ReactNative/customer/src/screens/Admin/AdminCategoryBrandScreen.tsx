import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useProductStore } from '../../store/productStore';

export default function AdminCategoryBrandScreen() {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<'category' | 'brand'>('category');
    const [newItemName, setNewItemName] = useState('');

    const { categories, brands, fetchCategoriesAndBrands, createCategory, createBrand } = useProductStore();

    useEffect(() => {
        fetchCategoriesAndBrands();
    }, []);

    const handleCreate = async () => {
        if (!newItemName.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên!');
            return;
        }

        try {
            if (activeTab === 'category') {
                await createCategory(newItemName);
                Alert.alert('Thành công', `Đã thêm danh mục: ${newItemName}`);
            } else {
                await createBrand(newItemName);
                Alert.alert('Thành công', `Đã thêm thương hiệu: ${newItemName}`);
            }
            setNewItemName(''); // Xóa trắng ô nhập
        } catch (error: any) {
            // Bắt lỗi mảng từ NestJS giống hệt trang Tạo Sản phẩm
            const errorMessage = Array.isArray(error?.message)
                ? error.message.join('\n')
                : (error?.message || 'Có lỗi xảy ra');
            Alert.alert('Lỗi', errorMessage);
        }
    };

    // Giao diện 1 thẻ (Chip) hiển thị tên Danh mục/Thương hiệu
    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.chip}>
            <Text style={styles.chipText}>{item.name}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Danh mục & Thương hiệu</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* TABS CHUYỂN ĐỔI */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'category' && styles.activeTab]}
                    onPress={() => setActiveTab('category')}
                >
                    <Text style={[styles.tabText, activeTab === 'category' && styles.activeTabText]}>DANH MỤC</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'brand' && styles.activeTab]}
                    onPress={() => setActiveTab('brand')}
                >
                    <Text style={[styles.tabText, activeTab === 'brand' && styles.activeTabText]}>THƯƠNG HIỆU</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* FORM THÊM MỚI */}
                <Text style={styles.label}>
                    Thêm {activeTab === 'category' ? 'Danh mục' : 'Thương hiệu'} mới
                </Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder={`VD: ${activeTab === 'category' ? 'Bàn phím cơ' : 'Logitech'}`}
                        value={newItemName}
                        onChangeText={setNewItemName}
                    />
                    <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* DANH SÁCH HIỆN CÓ */}
                <Text style={styles.label}>
                    Danh sách {activeTab === 'category' ? 'Danh mục' : 'Thương hiệu'} hiện tại:
                </Text>
                <FlatList
                    data={activeTab === 'category' ? categories : brands}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    numColumns={2}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#dc3545', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

    tabContainer: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#dc3545' },
    tabText: { fontSize: 16, fontWeight: 'bold', color: '#666' },
    activeTabText: { color: '#dc3545' },

    content: { padding: 20, flex: 1 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 10 },

    inputRow: { flexDirection: 'row', marginBottom: 20 },
    input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, fontSize: 16, marginRight: 10 },
    addButton: { backgroundColor: '#28a745', width: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

    chip: { width: '48%', backgroundColor: '#e6f2ff', padding: 15, borderRadius: 8, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#b3d7ff' },
    chipText: { fontSize: 15, fontWeight: 'bold', color: '#0056b3' }
});