import React, { useState, useCallback } from 'react';
import { Platform, 
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator, Alert, SafeAreaView, StatusBar
 } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useOrderStore } from '../../store/orderStore';

// Định nghĩa lại interface cho khớp với dữ liệu từ Backend NestJS
interface Order {
    subOrderId: string;
    parentOrderId: string;
    customer: {
        _id?: string;
        fullName: string;
        phone?: string;
    };
    shippingAddress: string;
    grandTotal: number;
    createdAt: string;
}

export default function PendingOrdersScreen() {
    const {
        shipperAvailableOrders,
        isLoading,
        fetchShipperAvailableOrders,
        updateShipperOrderStatus
    } = useOrderStore();
    const navigation = useNavigation<any>();
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchShipperAvailableOrders();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchShipperAvailableOrders();
        setRefreshing(false);
    };

    // Xử lý logic Nhận đơn hàng (Gọi qua Store)
    const handleAcceptOrder = (subOrderId: string) => {
        Alert.alert('Nhận đơn', `Bạn chắc chắn muốn nhận đơn hàng này?`, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đồng ý',
                onPress: async () => {
                    // Gọi action cập nhật trạng thái thành 'Shipped' (Đang giao)
                    const isSuccess = await updateShipperOrderStatus(subOrderId, 'Shipped');

                    if (isSuccess) {
                        Alert.alert('Thành công', 'Đã nhận đơn hàng!');
                        // Load lại danh sách đơn hàng chờ sau khi nhận thành công
                        fetchShipperAvailableOrders();
                    } else {
                        Alert.alert('Lỗi', 'Không thể nhận đơn lúc này, vui lòng thử lại.');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: Order }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.orderIdWrap}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={18} color="#888" />
                    <Text style={styles.orderId}> #{item.subOrderId?.slice(-8).toUpperCase()}</Text>
                </View>
                <Text style={styles.price}>{item.grandTotal?.toLocaleString('vi-VN')} ₫</Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <View style={styles.iconBox}>
                        <Ionicons name="person-outline" size={16} color="#007bff" />
                    </View>
                    <Text style={styles.infoText}>{item.customer?.fullName || 'Khách hàng ẩn danh'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <View style={styles.iconBox}>
                        <Ionicons name="location-outline" size={16} color="#cb1c22" />
                    </View>
                    <Text style={styles.infoText} numberOfLines={2}>{item.shippingAddress || 'Chưa cập nhật địa chỉ'}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.btnDetail} onPress={() => navigation.navigate('ShipperDelivery', { order: item })}>
                    <Text style={styles.btnDetailText}>Xem chi tiết</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnAccept} onPress={() => handleAcceptOrder(item.subOrderId)}>
                    <Ionicons name="bicycle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.btnAcceptText}>Nhận đơn ngay</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />

            {/* HEADER PHONG CÁCH FPT SHOP */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đơn hàng chờ nhận</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.container}>
                {isLoading && !refreshing ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#cb1c22" />
                        <Text style={{ marginTop: 10, color: '#666' }}>Đang tìm đơn hàng mới...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={shipperAvailableOrders}
                        keyExtractor={(item, index) => item.subOrderId || index.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#cb1c22']} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconBg}>
                                    <MaterialCommunityIcons name="package-variant-closed" size={60} color="#ccc" />
                                </View>
                                <Text style={styles.emptyText}>Hiện chưa có đơn hàng mới</Text>
                                <Text style={styles.emptySubText}>Hệ thống sẽ cập nhật ngay khi có khách hàng đặt đơn quanh khu vực của bạn.</Text>
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

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 16, paddingBottom: 30 },

    // Card Style
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5
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
    orderId: { fontWeight: 'bold', fontSize: 15, color: '#333' },
    price: { fontWeight: 'bold', fontSize: 18, color: '#cb1c22' },

    cardBody: { marginBottom: 15 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    iconBox: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 10
    },
    infoText: { fontSize: 14, color: '#444', flex: 1, lineHeight: 20 },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
    },
    btnDetail: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 10,
        backgroundColor: '#f8f9fa'
    },
    btnDetailText: { color: '#555', fontWeight: '600', fontSize: 14 },
    btnAccept: {
        flex: 1.2, // Cho nút nhận đơn to hơn một chút
        flexDirection: 'row',
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: '#cb1c22',
        elevation: 2,
        shadowColor: '#cb1c22',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3
    },
    btnAcceptText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

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