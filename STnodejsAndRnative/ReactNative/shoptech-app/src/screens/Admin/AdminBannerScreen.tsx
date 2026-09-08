import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBannerStore } from '../../store/bannerStore';

export default function AdminBannerScreen() {
    const navigation = useNavigation();
    const { allBanners, isLoading, fetchAllBanners, createBanner, toggleBanner } = useBannerStore();

    const [imageUrl, setImageUrl] = useState('');
    const [title, setTitle] = useState('');

    useEffect(() => {
        fetchAllBanners();
    }, []);

    const handleCreate = async () => {
        // 1. Kiểm tra bắt buộc phải nhập CẢ hình ảnh VÀ tiêu đề
        if (!imageUrl || !title) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Link hình ảnh và Tiêu đề!');
            return;
        }

        try {
            // 2. Đổi 'HOME' thành 'TopSlider' (Hoặc 'Sidebar' / 'Popup' tùy bạn muốn)
            await createBanner({
                imageUrl,
                title,
                position: 'TopSlider', // <-- Sửa ở đây cho chuẩn Enum của Backend
                isActive: true
            });

            setImageUrl('');
            setTitle(''); // Xóa trắng form
            Alert.alert('Thành công', 'Đã thêm banner mới!');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tạo banner');
        }
    };
    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.bannerCard}>
            <Image source={{ uri: item.imageUrl }} style={styles.previewImage} />
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Không tiêu đề'}</Text>
                <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#28a745' : '#999' }]}>
                        <Text style={styles.statusText}>{item.isActive ? 'ĐANG HIỆN' : 'ĐANG ẨN'}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.toggleBtn, { backgroundColor: item.isActive ? '#6c757d' : '#007bff' }]}
                        onPress={() => toggleBanner(item._id, !item.isActive)}
                    >
                        <Text style={styles.toggleBtnText}>{item.isActive ? 'Tắt' : 'Bật'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quản lý Banner</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.formContainer}>
                <Text style={styles.label}>Thêm Banner mới</Text>
                <TextInput style={styles.input} placeholder="Link hình ảnh (URL)" value={imageUrl} onChangeText={setImageUrl} />
                <TextInput style={styles.input} placeholder="Tiêu đề (Không bắt buộc)" value={title} onChangeText={setTitle} />
                <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
                    <Text style={styles.addButtonText}>THÊM BANNER</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.listTitle}>Danh sách Banner ({allBanners.length})</Text>
            {isLoading ? (
                <ActivityIndicator size="large" color="#d70018" />
            ) : (
                <FlatList
                    data={allBanners}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    header: { backgroundColor: '#d70018', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    formContainer: { backgroundColor: '#fff', padding: 15, marginBottom: 10, elevation: 2 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 15 },
    addButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
    addButtonText: { color: '#fff', fontWeight: 'bold' },
    listTitle: { fontSize: 18, fontWeight: 'bold', margin: 15 },
    bannerCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, overflow: 'hidden', elevation: 3, flexDirection: 'row' },
    previewImage: { width: 120, height: 80 },
    cardContent: { flex: 1, padding: 10, justifyContent: 'center' },
    cardTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    toggleBtn: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 6 },
    toggleBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});