import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useProductStore } from '../../store/productStore';

export default function AdminProductListScreen() {
    const navigation = useNavigation<any>();
    const { products, fetchProducts, deleteProduct } = useProductStore();

    // Load lại danh sách sản phẩm mỗi khi vào màn hình này
    useEffect(() => {
        fetchProducts();
    }, []);

    // Hàm xử lý Xóa
    const handleDelete = (id: string, name: string) => {
        Alert.alert('Cảnh báo nguy hiểm', `Bạn có chắc chắn muốn xóa "${name}" vĩnh viễn không?`, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'XÓA',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteProduct(id);
                        Alert.alert('Thành công', 'Đã xóa sản phẩm');
                    } catch (error: any) {
                        Alert.alert('Lỗi', error.message || 'Không thể xóa sản phẩm này');
                    }
                }
            }
        ]);
    };

    // Giao diện từng dòng sản phẩm
    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.images?.[0] || 'https://via.placeholder.com/100' }} style={styles.image} />
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.price}>{item.price?.toLocaleString('vi-VN')} đ</Text>
                <Text style={styles.stock}>Tồn kho: {item.stock}</Text>
            </View>

            <View style={styles.actionRow}>
                {/* NÚT SỬA: Chuyển sang form tạo nhưng gửi kèm data của sản phẩm */}
                <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => navigation.navigate('AdminCreateProduct', { product: item })}
                >
                    <Ionicons name="pencil" size={22} color="#007bff" />
                </TouchableOpacity>

                {/* NÚT XÓA */}
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item._id, item.name)}>
                    <Ionicons name="trash" size={22} color="#dc3545" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quản lý Kho hàng</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* NÚT THÊM SẢN PHẨM MỚI (Trống form) */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AdminCreateProduct')}
            >
                <Ionicons name="add-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.addButtonText}>THÊM SẢN PHẨM MỚI</Text>
            </TouchableOpacity>

            {/* DANH SÁCH SẢN PHẨM */}
            <FlatList
                data={products}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 15 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#dc3545', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    addButton: { backgroundColor: '#28a745', flexDirection: 'row', margin: 15, padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2, alignItems: 'center' },
    image: { width: 70, height: 70, borderRadius: 8 },
    info: { flex: 1, marginLeft: 15 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    price: { fontSize: 15, color: '#dc3545', marginVertical: 4 },
    stock: { fontSize: 13, color: '#666' },

    actionRow: { flexDirection: 'row' },
    iconBtn: { padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8, marginLeft: 10 }
});