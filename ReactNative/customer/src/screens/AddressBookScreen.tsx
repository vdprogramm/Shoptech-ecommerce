import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAddressStore } from '../store/addressStore';

export default function AddressBookScreen() {
    const navigation = useNavigation<any>();
    const { addresses, isLoading, fetchAddresses, deleteAddress } = useAddressStore();

    // Dùng useFocusEffect thay vì useEffect để khi sửa xong quay lại, nó tự động tải lại danh sách
    useFocusEffect(
        useCallback(() => {
            fetchAddresses();
        }, [])
    );

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            "Xóa địa chỉ",
            `Bạn có chắc muốn xóa địa chỉ "${name}" không?`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa", style: "destructive",
                    onPress: async () => {
                        const isSuccess = await deleteAddress(id);
                        if (isSuccess) {
                            Alert.alert("Thành công", "Đã xóa địa chỉ");
                        } else {
                            Alert.alert("Lỗi", "Không thể xóa địa chỉ");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name={item.isDefault ? 'home' : 'briefcase'} size={20} color="#007bff" style={{ marginRight: 8 }} />
                    {/* Hiển thị receiverName theo chuẩn Backend */}
                    <Text style={styles.name}>{item.receiverName || item.name || 'Địa chỉ'}</Text>
                </View>
                {item.isDefault && <Text style={styles.defaultBadge}>Mặc định</Text>}
            </View>

            {/* Hiển thị các trường địa chỉ theo chuẩn Backend */}
            <Text style={styles.address}>
                {item.street}, {item.ward}, {item.district}, {item.province || item.city}
            </Text>

            <View style={styles.actions}>
                {/* 1. Đã thêm onPress cho nút Sửa -> Chuyển sang màn EditAddress và mang theo item */}
                <TouchableOpacity onPress={() => navigation.navigate('EditAddress', { address: item })}>
                    <Text style={styles.editBtn}>Sửa</Text>
                </TouchableOpacity>

                {/* 2. Đã thêm onPress cho nút Xóa -> Gọi hàm handleDelete */}
                <TouchableOpacity onPress={() => handleDelete(item._id || item.id, item.receiverName || item.name)}>
                    <Text style={styles.deleteBtn}>Xóa</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sổ địa chỉ</Text>
                <View style={{ width: 28 }} />
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#28a745" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={addresses}
                    keyExtractor={(item) => item._id || item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 15 }}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>Chưa có địa chỉ nào được lưu.</Text>}
                />
            )}

            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddAddress')}>
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.addButtonText}>THÊM ĐỊA CHỈ MỚI</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#cb1c22', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    defaultBadge: { fontSize: 12, color: '#fff', backgroundColor: '#dc3545', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
    address: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 15 },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 },
    editBtn: { color: '#007bff', fontWeight: 'bold', marginRight: 20 },
    deleteBtn: { color: '#dc3545', fontWeight: 'bold' },
    addButton: { backgroundColor: '#cb1c22', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, margin: 15, borderRadius: 10 },
    addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }
});