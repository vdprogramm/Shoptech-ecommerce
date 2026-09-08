import React, { useState, useCallback } from 'react';
import { Platform, 
    View, Text, StyleSheet, FlatList, RefreshControl,
    ActivityIndicator, SafeAreaView, TouchableOpacity, StatusBar
 } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useOrderStore } from '../../store/orderStore';

// Định nghĩa giao diện dữ liệu trả về từ Backend
interface Trip {
    subOrderId: string;
    grandTotal: number;
    status: 'COMPLETED' | 'CANCELLED' | 'Delivered' | 'Cancelled';
    completedAt: string;
    customer: {
        fullName: string;
    };
}

export default function TripHistoryScreen() {
    const { shipperHistoryOrders, isLoading, fetchShipperHistory } = useOrderStore();
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<any>(); // Thêm navigation để dùng nút Back

    useFocusEffect(
        useCallback(() => {
            fetchShipperHistory();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchShipperHistory();
        setRefreshing(false);
    };

    const renderItem = ({ item }: { item: Trip }) => {
        // Kiểm tra trạng thái
        const isCompleted = item.status === 'Delivered' || item.status === 'COMPLETED';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.orderIdWrap}>
                        <Ionicons name="receipt-outline" size={16} color="#666" />
                        <Text style={styles.orderId}> #{item.subOrderId?.slice(-8).toUpperCase()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isCompleted ? '#e8f5e9' : '#fce8e8' }]}>
                        <Text style={[styles.statusText, { color: isCompleted ? '#28a745' : '#dc3545' }]}>
                            {isCompleted ? 'Hoàn thành' : 'Đã hủy'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={16} color="#666" />
                        <Text style={styles.customerName}>{item.customer?.fullName || 'Khách hàng ẩn danh'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.date}>
                            {item.completedAt
                                ? new Date(item.completedAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                : 'Chưa cập nhật thời gian'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.amountLabel}>Thu nhập (Tổng đơn):</Text>
                    <Text style={styles.amountValue}>{item.grandTotal?.toLocaleString('vi-VN')} đ</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />

            {/* HEADER PHONG CÁCH FPT SHOP */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch sử chuyến đi</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.container}>
                {isLoading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#cb1c22" />
                        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={shipperHistoryOrders}
                        keyExtractor={(item, index) => item.subOrderId || index.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#cb1c22']} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconBg}>
                                    <MaterialCommunityIcons name="clipboard-text-clock-outline" size={60} color="#ccc" />
                                </View>
                                <Text style={styles.emptyText}>Chưa có lịch sử chuyến đi</Text>
                                <Text style={styles.emptySubText}>Những đơn hàng bạn giao hoàn tất hoặc bị hủy sẽ xuất hiện tại đây.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#cb1c22', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    container: { flex: 1, backgroundColor: '#f4f6f8' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingBottom: 12,
        paddingTop: 10,
        backgroundColor: '#cb1c22',
    },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

    // List & Loading
    listContainer: { padding: 16, paddingBottom: 30 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#666', fontSize: 14 },

    // Card UI
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    orderIdWrap: { flexDirection: 'row', alignItems: 'center' },
    orderId: { fontWeight: 'bold', fontSize: 15, color: '#333' },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontWeight: 'bold', fontSize: 12 },

    cardBody: { marginBottom: 15 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    customerName: { fontSize: 14, color: '#333', fontWeight: '500', marginLeft: 8 },
    date: { fontSize: 13, color: '#666', marginLeft: 8 },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginTop: 5
    },
    amountLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
    amountValue: { fontWeight: 'bold', fontSize: 16, color: '#cb1c22' },

    // Empty State
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyIconBg: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
        marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05
    },
    emptyText: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    emptySubText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 }
});