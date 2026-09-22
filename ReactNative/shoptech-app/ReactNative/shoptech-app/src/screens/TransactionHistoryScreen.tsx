import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOrderStore } from '../store/orderStore';

export default function TransactionHistoryScreen() {
    const navigation = useNavigation<any>();
    const { orders, fetchMyOrders, isLoading } = useOrderStore();
    
    useEffect(() => {
        fetchMyOrders();
    }, []);

    const transactions = (orders || []).filter(order => order.paymentStatus === 'Paid' || order.paymentMethod === 'COD');

    const renderItem = ({ item }: any) => {
        const date = new Date(item.createdAt).toLocaleDateString('vi-VN');
        const time = new Date(item.createdAt).toLocaleTimeString('vi-VN');
        
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>Mã ĐH: {item.orderCode}</Text>
                    <Text style={styles.date}>{time} - {date}</Text>
                </View>
                <View style={styles.cardBody}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Tổng tiền:</Text>
                        <Text style={styles.amount}>{item.totalAmount?.toLocaleString('vi-VN')} đ</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Phương thức:</Text>
                        <Text style={styles.method}>
                            {item.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 
                             item.paymentMethod === 'VNPAY' ? 'Thanh toán qua VNPAY' : 
                             item.paymentMethod === 'VietQR' ? 'Thanh toán qua VietQR (PayOS)' : 
                             item.paymentMethod || 'Thanh toán trực tuyến'}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Trạng thái:</Text>
                        <Text style={[styles.status, { color: item.paymentStatus === 'Paid' ? '#2e7d32' : '#f57c00' }]}>
                            {item.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#d70018" />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="receipt-text-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>Bạn chưa có giao dịch nào.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 15 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
        marginBottom: 10,
    },
    orderId: { fontWeight: 'bold', color: '#333' },
    date: { color: '#888', fontSize: 12 },
    cardBody: {},
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    label: { color: '#666', fontSize: 14 },
    amount: { fontWeight: 'bold', color: '#d70018', fontSize: 15 },
    method: { color: '#333', fontSize: 14 },
    status: { fontWeight: '500', fontSize: 14 },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 10, color: '#999', fontSize: 15 },
});
