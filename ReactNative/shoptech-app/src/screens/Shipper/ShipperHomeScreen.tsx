import React, { useState, useEffect, useCallback } from 'react';
import { Platform,  View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert, StatusBar  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import axiosClient, { BASE_URL } from '../../api/axiosClient';
import { io, Socket } from 'socket.io-client';

export default function ShipperHomeScreen() {
    const { user, token } = useAuthStore();
    const navigation = useNavigation<any>();
    const [isActive, setIsActive] = useState(user?.isOnline || false);
    const [orders, setOrders] = useState<any[]>([]);
    const [ongoingOrders, setOngoingOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, walletBalance: 0 });

    const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

    // Hàm format tiền tệ (Khắc phục lỗi gạch đỏ)
    const formatMoney = (val: number) => {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
        if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
        return val.toString();
    };

    const fetchStats = async () => {
        try {
            const response: any = await axiosClient.get('/statistics/general');
            const data = response.data || response;
            setStats({
                todayOrders: data.todayOrders || 0,
                todayRevenue: data.todayRevenue || 0,
                walletBalance: data.walletBalance || 0
            });
        } catch (error) {
            console.error('Lỗi lấy thống kê shipper:', error);
        }
    };

    const fetchAvailableOrders = async () => {
        setIsLoading(true);
        try {
            const [availableRes, ongoingRes]: any = await Promise.all([
                axiosClient.get('/orders/shipper/available'),
                axiosClient.get('/orders/shipper/ongoing')
            ]);
            setOrders(availableRes.data || availableRes);
            setOngoingOrders(ongoingRes.data || ongoingRes);
        } catch (error) {
            console.error('Lỗi lấy danh sách đơn giao:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // TỰ ĐỘNG LÀM MỚI DỮ LIỆU MỖI KHI MÀN HÌNH ĐƯỢC HIỂN THỊ
    useFocusEffect(
        useCallback(() => {
            if (isActive) {
                fetchAvailableOrders();
                fetchStats();
            }
        }, [isActive])
    );

    const handleToggleOnline = async (newStatus?: boolean) => {
        const targetStatus = newStatus !== undefined ? newStatus : !isActive;
        try {
            await axiosClient.patch('/users/shipper/toggle-online', { isOnline: targetStatus });
            setIsActive(targetStatus);

            if (user) {
                useAuthStore.getState().updateUser({ ...user, isOnline: targetStatus });
            }

            if (targetStatus) {
                fetchStats();
                fetchAvailableOrders();
            }
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái online:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
        }
    };

    useEffect(() => {
        let newSocket: Socket;

        if (isActive) {
            fetchAvailableOrders();
            fetchStats();

            newSocket = io('http://10.0.2.2:3001', {
                auth: { token: token || '' }
            });

            newSocket.on('connect', () => {
                console.log('🟢 Socket Connected: Đã kết nối nhận đơn Real-time');
            });

            newSocket.on('new_order_available', (payload) => {
                console.log('🔔 CÓ ĐƠN MỚI TỪ SOCKET:', payload);
                fetchAvailableOrders();
            });

            setSocketInstance(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else {
            setOrders([]);
            setOngoingOrders([]);
            if (socketInstance) {
                socketInstance.disconnect();
                setSocketInstance(null);
            }
        }
    }, [isActive, token]);

    const handleAcceptOrder = async (item: any) => {
        try {
            setIsLoading(true);
            await axiosClient.patch('/orders/shipper/update-status', {
                subOrderId: item.subOrderId,
                status: 'Shipped'
            });

            // Ép trạng thái thành 'Shipped' truyền sang trang chi tiết
            navigation.navigate('ShipperDelivery', { order: { ...item, status: 'Shipped' } });

            fetchAvailableOrders();
        } catch (error: any) {
            console.error('Lỗi nhận đơn:', error);
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể nhận đơn hàng này.');
            setIsLoading(false);
        }
    };

    const renderOrderItem = ({ item, isOngoing }: { item: any; isOngoing?: boolean }) => (
        <View style={[styles.orderCard, isOngoing && { borderColor: '#cb1c22', borderWidth: 1 }]}>
            {isOngoing && (
                <View style={styles.ongoingBadge}>
                    <Text style={styles.ongoingBadgeText}>⚠️ ĐƠN HÀNG ĐANG GIAO</Text>
                </View>
            )}
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Mã: {item.subOrderId?.slice(-8).toUpperCase()}</Text>
                <Text style={styles.orderPrice}>{(item.grandTotal || 0).toLocaleString('vi-VN')} đ</Text>
            </View>

            <View style={styles.orderRoute}>
                <View style={styles.routePoint}>
                    <Ionicons name="storefront" size={18} color="#007bff" />
                    <Text style={styles.routeText} numberOfLines={2}>
                        <Text style={styles.routeLabel}>Lấy hàng: </Text>
                        {item.store?.name ? `${item.store.name} - ` : ''}{item.store?.address || 'Chưa có địa chỉ cửa hàng'}
                    </Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                    <Ionicons name="location" size={18} color="#cb1c22" />
                    <Text style={styles.routeText} numberOfLines={2}>
                        <Text style={styles.routeLabel}>Giao đến: </Text>
                        {(item.shippingAddress || 'Chưa có địa chỉ giao').replace(/, undefined/g, '').replace(/undefined/g, '')}
                    </Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                    <Ionicons name="cube" size={18} color="#28a745" />
                    <Text style={styles.routeText} numberOfLines={1}>
                        <Text style={styles.routeLabel}>Khách hàng: </Text>
                        {item.customer?.fullName} - {item.paymentMethod}
                    </Text>
                </View>
            </View>

            <View style={styles.orderFooter}>
                <View style={styles.distanceWrap}>
                    <Ionicons name="bicycle-outline" size={18} color="#666" />
                    <Text style={styles.orderDistance}>--- km</Text>
                </View>
                {isOngoing ? (
                    <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: '#cb1c22' }]} onPress={() => navigation.navigate('ShipperDelivery', { order: item })}>
                        <Text style={styles.acceptBtnText}>TIẾP TỤC GIAO</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptOrder(item)}>
                        <Text style={styles.acceptBtnText}>NHẬN ĐƠN</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />

            <LinearGradient
                colors={['#cb1c22', '#f43f5e']}
                style={styles.headerBg}
            >
                <View style={styles.headerTop}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatarWrap}>
                            <Image
                                source={{ uri: user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`) : 'https://ui-avatars.com/api/?name=' + (user?.fullName || 'Shipper') + '&background=random' }}
                                style={styles.avatar}
                            />
                            <View style={[styles.activeDot, { backgroundColor: isActive ? '#4cd964' : '#ccc' }]} />
                        </View>
                        <View>
                            <Text style={styles.userName}>{user?.fullName || 'Tài xế ShopTech'}</Text>
                            <Text style={styles.statusText}>{isActive ? 'Đang sẵn sàng nhận đơn' : 'Đang ngoại tuyến'}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.toggleBtn, { backgroundColor: isActive ? '#fff' : 'rgba(255,255,255,0.2)' }]}
                        onPress={() => handleToggleOnline()}
                    >
                        <Ionicons name={isActive ? "power" : "power-outline"} size={18} color={isActive ? "#cb1c22" : "#fff"} />
                        <Text style={[styles.toggleText, { color: isActive ? "#cb1c22" : "#fff" }]}>
                            {isActive ? 'TẮT' : 'BẬT'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.container}>
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{stats.todayOrders}</Text>
                        <Text style={styles.statLabel}>Đơn hôm nay</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{formatMoney(stats.todayRevenue)}</Text>
                        <Text style={styles.statLabel}>Thu nhập (đ)</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{formatMoney(stats.walletBalance)}</Text>
                        <Text style={styles.statLabel}>Ví tài khoản</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {isActive ? 'Đơn hàng mới quanh đây' : 'Trạng thái hiện tại'}
                        </Text>
                        {isActive && (
                            <TouchableOpacity onPress={fetchAvailableOrders}>
                                <Ionicons name="refresh-circle" size={28} color="#cb1c22" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {isActive ? (
                        isLoading && orders.length === 0 && ongoingOrders.length === 0 ? (
                            <View style={styles.emptyState}>
                                <ActivityIndicator size="large" color="#cb1c22" />
                                <Text style={[styles.emptyStateText, { marginTop: 15 }]}>Đang tải danh sách đơn...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={[...ongoingOrders.filter((o: any) => o.status !== 'Delivered'), ...orders]}
                                keyExtractor={item => item.subOrderId || Math.random().toString()}
                                renderItem={({ item }) => renderOrderItem({ item, isOngoing: item.status === 'Shipped' })}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.listContent}
                                ListEmptyComponent={() => (
                                    <View style={styles.emptyState}>
                                        <View style={styles.emptyIconContainer}>
                                            <Ionicons name="cube-outline" size={54} color="#cb1c22" />
                                            <View style={styles.sparkleIcon}>
                                                <Ionicons name="sparkles" size={20} color="#f43f5e" />
                                            </View>
                                        </View>
                                        <Text style={styles.emptyStateText}>Chưa có đơn hàng mới</Text>
                                        <Text style={styles.emptyStateSubText}>Hệ thống đang quét các đơn hàng xung quanh bạn. Vui lòng giữ ứng dụng mở nhé!</Text>
                                    </View>
                                )}
                            />
                        )
                    ) : (
                        <View style={styles.emptyStateOffline}>
                            <View style={styles.offlineIconWrap}>
                                <Ionicons name="moon-outline" size={54} color="#888" />
                            </View>
                            <Text style={styles.emptyStateText}>Bạn đang ngoại tuyến</Text>
                            <Text style={styles.emptyStateSubText}>Bật trạng thái hoạt động để hệ thống phân bổ đơn hàng cho bạn và tăng thu nhập ngay hôm nay!</Text>

                            <TouchableOpacity
                                style={styles.bigTurnOnBtn}
                                onPress={() => handleToggleOnline(true)}
                            >
                                <Text style={styles.bigTurnOnBtnText}>BẬT HOẠT ĐỘNG NGAY</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#cb1c22', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    container: { flex: 1, backgroundColor: '#f4f6f8' },
    headerBg: { paddingTop: 15, paddingHorizontal: 20, paddingBottom: 45, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatarWrap: { position: 'relative', marginRight: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#fff' },
    activeDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff' },
    userName: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
    statusText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    toggleBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 25, gap: 6, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    toggleText: { fontWeight: 'bold', fontSize: 13 },
    statsContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 18, justifyContent: 'space-between', marginHorizontal: 20, marginTop: -35, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
    statBox: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 19, fontWeight: '900', color: '#cb1c22', marginBottom: 4 },
    statLabel: { fontSize: 12, color: '#666', fontWeight: '600' },
    statDivider: { width: 1, backgroundColor: '#eee', marginHorizontal: 10 },
    content: { flex: 1, paddingTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    listContent: { paddingHorizontal: 16, paddingBottom: 30 },
    orderCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 18, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
    ongoingBadge: { backgroundColor: '#ffe8e8', padding: 10, borderTopLeftRadius: 18, borderTopRightRadius: 18, marginBottom: 12, alignItems: 'center', marginHorizontal: -18, marginTop: -18 },
    ongoingBadgeText: { color: '#cb1c22', fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#f0f0f0' },
    orderId: { fontSize: 14, fontWeight: '700', color: '#666' },
    orderPrice: { fontSize: 17, fontWeight: '900', color: '#cb1c22' },
    orderRoute: { marginBottom: 15 },
    routePoint: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    routeLine: { width: 2, height: 24, backgroundColor: '#e0e0e0', marginLeft: 9, marginVertical: 4 },
    routeText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 22 },
    routeLabel: { fontWeight: '700', color: '#555' },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    distanceWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f8f9fa', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
    orderDistance: { fontSize: 13, color: '#555', fontWeight: '600' },
    acceptBtn: { backgroundColor: '#cb1c22', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, elevation: 3, shadowColor: '#cb1c22', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
    acceptBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40, paddingHorizontal: 20 },
    emptyIconContainer: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#cb1c22', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#ffebe9', position: 'relative' },
    sparkleIcon: { position: 'absolute', top: 22, right: 22 },
    emptyStateOffline: { alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingHorizontal: 30 },
    offlineIconWrap: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 20, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#eee' },
    emptyStateText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
    emptyStateSubText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 30, paddingHorizontal: 15 },
    bigTurnOnBtn: { backgroundColor: '#cb1c22', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, elevation: 5, shadowColor: '#cb1c22', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    bigTurnOnBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 }
});