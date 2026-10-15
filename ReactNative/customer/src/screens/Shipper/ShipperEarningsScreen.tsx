import React, { useState, useEffect } from 'react';
import { Platform,  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, StatusBar  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axiosClient from '../../api/axiosClient';

export default function ShipperEarningsScreen() {
    const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, walletBalance: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const response: any = await axiosClient.get('/statistics/general');
            const data = response.data || response;
            setStats({
                todayOrders: data.todayOrders || 0,
                todayRevenue: data.todayRevenue || 0,
                walletBalance: data.walletBalance || 0
            });
        } catch (error) {
            console.error('Lỗi lấy thống kê thu nhập:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const formatMoney = (amount: number) => {
        return (amount || 0).toLocaleString('vi-VN') + ' ₫';
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />

            {/* HEADER */}
            <LinearGradient colors={['#cb1c22', '#f43f5e']} style={styles.header}>
                <Text style={styles.headerTitle}>Thu nhập của bạn</Text>
                <Text style={styles.headerSub}>Thống kê tổng quan doanh thu</Text>
            </LinearGradient>

            <View style={styles.container}>
                {isLoading && !refreshing ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#cb1c22" />
                        <Text style={{ marginTop: 10, color: '#666' }}>Đang tải dữ liệu...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={[{ id: '1' }]}
                        keyExtractor={(i) => i.id}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#cb1c22']} />}
                        renderItem={() => (
                            <View style={styles.content}>
                                {/* KHỐI VÍ TÀI KHOẢN - PREMIUM DARK CARD */}
                                <LinearGradient colors={['#232526', '#414345']} style={styles.walletCard}>
                                    {/* Họa tiết trang trí chìm */}
                                    <View style={styles.circleDecoration1} />
                                    <View style={styles.circleDecoration2} />

                                    <View style={styles.walletHeader}>
                                        <View style={styles.walletIconBg}>
                                            <Ionicons name="wallet-outline" size={22} color="#fff" />
                                        </View>
                                        <Text style={styles.walletTitle}>Số dư khả dụng</Text>
                                    </View>
                                    <Text style={styles.walletBalance}>{formatMoney(stats.walletBalance)}</Text>

                                    <View style={styles.walletFooter}>
                                        <Text style={styles.walletFooterText}>ShopTech Partner</Text>
                                        <Ionicons name="shield-checkmark" size={16} color="#4cd964" />
                                    </View>
                                </LinearGradient>

                                {/* KHỐI THỐNG KÊ HÔM NAY */}
                                <Text style={styles.sectionTitle}>Hôm nay</Text>
                                <View style={styles.statsRow}>
                                    {/* Số cuốc xe */}
                                    <View style={styles.statCard}>
                                        <View style={styles.iconWrapInfo}>
                                            <Ionicons name="bicycle" size={24} color="#007bff" />
                                        </View>
                                        <Text style={styles.statValue}>{stats.todayOrders}</Text>
                                        <Text style={styles.statLabel}>Chuyến đi hoàn thành</Text>
                                    </View>

                                    {/* Thu nhập */}
                                    <View style={styles.statCard}>
                                        <View style={styles.iconWrapSuccess}>
                                            <Ionicons name="cash-outline" size={24} color="#cb1c22" />
                                        </View>
                                        <Text style={styles.statValue}>
                                            {stats.todayRevenue >= 1000000
                                                ? (stats.todayRevenue / 1000000).toFixed(1) + 'M'
                                                : stats.todayRevenue >= 1000
                                                    ? (stats.todayRevenue / 1000).toFixed(0) + 'k'
                                                    : stats.todayRevenue}
                                        </Text>
                                        <Text style={styles.statLabel}>Thu nhập tạm tính</Text>
                                    </View>
                                </View>

                                {/* GHI CHÚ */}
                                <View style={styles.infoBox}>
                                    <Ionicons name="information-circle" size={24} color="#cb1c22" />
                                    <Text style={styles.infoText}>
                                        Thu nhập mỗi cuốc xe sẽ được cộng trực tiếp vào ví sau khi bạn giao hàng thành công.
                                    </Text>
                                </View>
                            </View>
                        )}
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
        paddingBottom: 55, // Tăng thêm từ 45 lên 55 để viền đỏ dài ra thêm
        backgroundColor: '#cb1c22',
    },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
    headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20, paddingTop: 0 },

    // PREMIUM WALLET CARD
    walletCard: {
        marginTop: 10, // Nằm đè lên Header
        borderRadius: 20,
        padding: 24,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        overflow: 'hidden', // Để cắt họa tiết chìm
        marginBottom: 25,
    },
    circleDecoration1: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    circleDecoration2: {
        position: 'absolute',
        bottom: -40,
        right: 40,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    walletHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    walletIconBg: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        borderRadius: 12,
        marginRight: 12,
    },
    walletTitle: { fontSize: 15, color: '#aaa', fontWeight: '500' },
    walletBalance: { fontSize: 36, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
    walletFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    walletFooterText: { color: '#888', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold' },

    // Stats Section
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, paddingLeft: 4 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginBottom: 25 },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'flex-start', // Căn trái hiện đại
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    iconWrapInfo: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: '#e7f1ff',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
    },
    iconWrapSuccess: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: '#ffe8e8',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
    },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 6 },
    statLabel: { fontSize: 13, color: '#666', fontWeight: '500' },

    // Info Box
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#fff5f5',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#fce8e8',
    },
    infoText: { flex: 1, color: '#cb1c22', fontSize: 13, lineHeight: 20, fontWeight: '500' }
});