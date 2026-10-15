import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useVoucherStore, Voucher } from '../store/voucherStore';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function VoucherScreen() {
    const { vouchers, isLoading, fetchPublicVouchers } = useVoucherStore();
    const navigation = useNavigation();

    useEffect(() => {
        fetchPublicVouchers();
    }, []);

    const renderItem = ({ item }: { item: Voucher }) => (
        <View style={styles.voucherCard}>
            <View style={styles.voucherLeft}>
                <Text style={styles.discountText}>
                    {item.discountType === 'percent' ? `${item.discountAmount}%` : `${item.discountAmount.toLocaleString('vi-VN')}đ`}
                </Text>
                <Text style={styles.discountLabel}>GIẢM</Text>
            </View>
            <View style={styles.voucherRight}>
                <Text style={styles.codeText}>Mã: {item.code}</Text>
                <Text style={styles.minOrderText}>Đơn tối thiểu: {item.minOrderValue.toLocaleString('vi-VN')}đ</Text>
                <Text style={styles.expireText}>HSD: {new Date(item.expirationDate).toLocaleDateString('vi-VN')}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mã giảm giá</Text>
                <View style={{ width: 24 }} />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#d70018" />
                </View>
            ) : (
                <FlatList
                    data={vouchers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>Hiện chưa có mã giảm giá nào</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
        paddingBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: '#cb1c22', // FPT Shop Red
        borderBottomWidth: 1,
        borderBottomColor: '#cb1c22',
    },
    backBtn: { padding: 5 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 15 },
    voucherCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        overflow: 'hidden',
    },
    voucherLeft: {
        backgroundColor: '#d70018',
        padding: 15,
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
    },
    discountText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    discountLabel: { color: '#fff', fontSize: 12, marginTop: 4 },
    voucherRight: {
        padding: 15,
        flex: 1,
        justifyContent: 'center',
    },
    codeText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    minOrderText: { fontSize: 13, color: '#666', marginBottom: 3 },
    expireText: { fontSize: 12, color: '#999' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#666' },
});
