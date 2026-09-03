import React, { useState, useEffect } from 'react';
import { Platform,  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, StatusBar  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axiosClient from '../../api/axiosClient';

export default function ShipperServicesScreen() {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const response: any = await axiosClient.get('/orders/shipper/history');
            setHistory(response.data || response);
        } catch (error) {
            console.error('Lỗi lấy lịch sử đơn hàng:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatMoney = (amount: number) => {
        return (amount || 0).toLocaleString('vi-VN') + ' ₫';
    };

    const renderHistoryItem = ({ item }: { item: any }) => {
        const isDelivered = item.status === 'Delivered' || item.status === 'COMPLETED';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.orderIdWrap}>
                        <Ionicons name="receipt-outline" size={16} color="#666" />
                        <Text style={styles.orderId}> #{item.subOrderId?.slice(-8).toUpperCase()}</Text>
                    </View>
                    <View style={[styles.statusBadge, isDelivered ? styles.badgeSuccess : styles.badgeError]}>
                        <Text style={[styles.statusText, isDelivered ? styles.textSuccess : styles.textError]}>
                            {isDelivered ? 'Đã giao' : 'Đã hủy'}
                        </Text>
                    </View>
                </View>

                <View style={styles.routeContainer}>
                    <View style={styles.routePoint}>
                        <Ionicons name="storefront" size={18} color="#007bff" />
                        <Text style={styles.routeText} numberOfLines={1}>
                            <Text style={styles.routeLabel}>Lấy: </Text>
                            {item.store?.name || 'Cửa hàng ShopTech'}
                        </Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routePoint}>
                        <Ionicons name="location" size={18} color="#cb1c22" />
                        <Text style={styles.routeText} numberOfLines={2}>
                            <Text style={styles.routeLabel}>Giao: </Text>
                            {item.shippingAddress || 'Chưa có địa chỉ giao'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.footerLabel}>Hoàn thành lúc</Text>
                        <Text style={styles.footerValue}>{formatDate(item.completedAt)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.footerLabel}>Thu nhập</Text>
                        <Text style={[styles.footerValue, { color: '#28a745', fontSize: 16 }]}>
                            +{formatMoney(item.shippingFee)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />

            {/* HEADER PHONG CÁCH FPT SHOP */}
            <LinearGradient colors={['#cb1c22', '#f43f5e']} style={styles.header}>
                <Text style={styles.headerTitle}>Lịch sử chuyến đi</Text>
                <Text style={styles.headerSub}>Danh sách các đơn hàng đã hoàn thành hoặc hủy</Text>
            </LinearGradient>

            <View style={styles.container}>
                {isLoading && !refreshing ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#cb1c22" />
                        <Text style={{ marginTop: 10, color: '#666' }}>Đang tải lịch sử...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={history}
                        keyExtractor={(item) => item.subOrderId || Math.random().toString()}
                        renderItem={renderHistoryItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#cb1c22']} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconBg}>
                                    <Ionicons name="receipt-outline" size={60} color="#ccc" />
                                </View>
                                <Text style={styles.emptyText}>Chưa có chuyến đi nào</Text>
                                <Text style={styles.emptySubText}>Các đơn hàng bạn đã giao thành công hoặc bị hủy sẽ được lưu lại tại đây.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#cb1c22' },
    container: { flex: 1, backgroundColor: '#f4f6f8' },

    // Header
    header: {
        padding: 20,
        paddingTop: 15,
        paddingBottom: 25,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSub: { fontSize: 14, color: '#ffe8e8', marginTop: 4 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 15, paddingTop: 20, paddingBottom: 30 },

    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 16,
        marginBottom: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    orderIdWrap: { flexDirection: 'row', alignItems: 'center' },
    orderId: { fontSize: 15, fontWeight: 'bold', color: '#333' },

    statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
    badgeSuccess: { backgroundColor: '#e8f5e9' },
    badgeError: { backgroundColor: '#fce8e8' },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    textSuccess: { color: '#28a745' },
    textError: { color: '#cb1c22' },

    // Route
    routeContainer: { marginBottom: 15 },
    routePoint: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    routeLine: { width: 2, height: 15, backgroundColor: '#e0e0e0', marginLeft: 8, marginVertical: 4 },
    routeText: { fontSize: 14, color: '#333', flex: 1, lineHeight: 20 },
    routeLabel: { fontWeight: 'bold', color: '#666' },

    // Footer
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 10,
        marginTop: 5
    },
    footerLabel: { fontSize: 12, color: '#888', marginBottom: 4, fontWeight: '500' },
    footerValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },

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