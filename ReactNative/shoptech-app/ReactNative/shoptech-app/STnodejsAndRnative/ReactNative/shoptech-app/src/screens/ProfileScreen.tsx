import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axiosClient from '../api/axiosClient';

import ShipperProfileScreen from './Shipper/ShipperProfileScreen';

export default function ProfileScreen() {
    const { logout, user } = useAuthStore();
    const navigation = useNavigation<any>();
    const [points, setPoints] = useState(0);

    // 1. ĐẶT TOÀN BỘ HOOKS LÊN TRÊN TRƯỚC KHI CÓ BẤT KỲ ĐIỀU KIỆN RETURN NÀO
    useFocusEffect(
        useCallback(() => {
            const fetchPoints = async () => {
                if (user) {
                    try {
                        const response: any = await axiosClient.get('/points/balance');
                        const balance = response.totalPoints ?? response.points ?? response.balance ?? (typeof response === 'number' ? response : 0);
                        setPoints(Number(balance) || 0);
                    } catch (error) {
                        console.log('Error fetching points:', error);
                    }
                }
            };
            fetchPoints();
        }, [user])
    );

    const currentUser = user || { fullName: 'Quý Khách', email: '0943 *** ***', roles: ['CUSTOMER'] };
    const userRoles = currentUser.roles || [];

    const isShipper = userRoles.includes('SHIPPER');
    const isAdmin = userRoles.includes('ADMIN');
    const isStaff = userRoles.includes('STAFF');

    // 2. CÂU LỆNH RETURN SỚM ĐẶT SAU KHI ĐÃ GỌI HẾT TẤT CẢ CÁC HOOKS
    if (isShipper) {
        return <ShipperProfileScreen />;
    }

    const getRoleDisplay = () => {
        if (isAdmin) return { name: 'Quản trị viên', color: '#111' };
        if (isStaff) return { name: 'Nhân viên', color: '#007bff' };
        return { name: 'Khách hàng thân thiết', color: '#cb1c22' };
    };

    const roleDisplay = getRoleDisplay();

    const MenuItem = ({ icon, title, onPress, iconColor = "#8e8e93", showBorder = true }: any) => (
        <TouchableOpacity
            style={[styles.menuItem, !showBorder && { borderBottomWidth: 0 }]}
            onPress={onPress}
        >
            <View style={styles.menuItemLeft}>
                <Ionicons name={icon} size={22} color={iconColor} />
                <Text style={styles.menuItemText}>{title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />
            <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>

                {/* HEADER PHONG CÁCH FPT SHOP */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarCircle}>
                                {currentUser?.avatar ? (
                                    <Image source={{ uri: currentUser.avatar }} style={{ width: '100%', height: '100%', borderRadius: 32 }} />
                                ) : (
                                    <Ionicons name="person" size={40} color="#cb1c22" />
                                )}
                            </View>
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{currentUser.fullName || 'Quý Khách'}</Text>
                            <View style={styles.phoneRow}>
                                <Text style={styles.userPhone}>{currentUser.email || '0943 *** ***'}</Text>
                                <Ionicons name="eye-off-outline" size={14} color="#f0f0f0" style={{ marginLeft: 8 }} />
                            </View>

                            {/* Nút điểm thưởng thiết kế nổi bật trên nền đỏ */}
                            <TouchableOpacity style={styles.pointsBadge}>
                                <View style={styles.pointsIcon}>
                                    <Text style={{ color: '#cb1c22', fontSize: 10, fontWeight: '900' }}>F</Text>
                                </View>
                                <Text style={styles.pointsText}>{points.toLocaleString('vi-VN')} điểm</Text>
                                <Ionicons name="chevron-forward" size={14} color="#ffc107" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.notificationBtn}>
                            <Ionicons name="notifications-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* KHỐI ĐƠN HÀNG */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Đơn hàng của bạn</Text>
                    <View style={styles.orderSteps}>
                        <TouchableOpacity style={styles.stepItem} onPress={() => navigation.navigate('MyOrders', { activeTab: 'PROCESSING' })}>
                            <MaterialCommunityIcons name="wallet-giftcard" size={28} color="#555" />
                            <Text style={styles.stepText}>Đang xử lý</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.stepItem} onPress={() => navigation.navigate('MyOrders', { activeTab: 'SHIPPING' })}>
                            <MaterialCommunityIcons name="truck-fast-outline" size={28} color="#555" />
                            <Text style={styles.stepText}>Đang giao</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.stepItem} onPress={() => navigation.navigate('MyOrders', { activeTab: 'COMPLETED' })}>
                            <MaterialCommunityIcons name="star-circle-outline" size={28} color="#555" />
                            <Text style={styles.stepText}>Đánh giá</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <MenuItem icon="receipt-outline" title="Tất cả đơn hàng" onPress={() => navigation.navigate('MyOrders')} iconColor="#cb1c22" />
                    <MenuItem icon="time-outline" title="Lịch sử giao dịch" onPress={() => navigation.navigate('TransactionHistory')} iconColor="#cb1c22" />
                    <MenuItem icon="shield-half-outline" title="Thông tin bảo hành" onPress={() => navigation.navigate('WarrantyLookup')} iconColor="#cb1c22" showBorder={false} />
                </View>

                {/* KHỐI TÀI KHOẢN */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Tiện ích cá nhân</Text>
                    <MenuItem icon="person-circle-outline" title="Thông tin tài khoản" onPress={() => navigation.navigate('AccountInfo')} iconColor="#333" />
                    <MenuItem icon="heart-circle-outline" title="Sản phẩm yêu thích" onPress={() => navigation.navigate('Wishlist')} iconColor="#cb1c22" />
                    <MenuItem icon="location-outline" title="Sổ địa chỉ nhận hàng" onPress={() => navigation.navigate('AddressBook')} iconColor="#333" showBorder={false} />
                </View>

                {/* KHỐI QUẢN TRỊ (ADMIN/STAFF) */}
                {(isAdmin || isStaff) && (
                    <View style={styles.card}>
                        <Text style={[styles.cardTitle, { color: roleDisplay.color }]}>Khu vực {roleDisplay.name}</Text>
                        <MenuItem icon="cube-outline" title="Quản lý Sản phẩm / Kho" onPress={() => navigation.navigate('AdminProductList')} iconColor="#dc3545" />
                        <MenuItem icon="pricetags-outline" title="Quản lý Danh mục & Hãng" onPress={() => navigation.navigate('AdminCategoryBrand')} iconColor="#007bff" />
                        <MenuItem icon="images-outline" title="Quản lý Banner" onPress={() => navigation.navigate('AdminBanner')} iconColor="#e60073" />
                        <MenuItem icon="pie-chart-outline" title="Báo Cáo ShopTech" onPress={() => navigation.navigate('AdminDashboard')} iconColor="#e60073" />
                        {isAdmin && (
                            <MenuItem icon="people-outline" title="Quản lý Phân quyền" onPress={() => navigation.navigate('AdminUserList')} iconColor="#ff9800" showBorder={false} />
                        )}
                    </View>
                )}

                {/* NÚT ĐĂNG XUẤT */}
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#cb1c22' },
    container: { flex: 1, backgroundColor: '#f4f6f8' },

    // Header đỏ đặc trưng
    header: {
        padding: 16,
        paddingTop: 16,
        paddingBottom: 35,
        backgroundColor: '#cb1c22',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTop: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { marginRight: 15 },
    avatarCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ffeb3b',
        overflow: 'hidden'
    },
    userInfo: { flex: 1 },
    userName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    userPhone: { fontSize: 13, color: '#f0f0f0' },

    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 15,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginTop: 10,
        alignSelf: 'flex-start'
    },
    pointsIcon: { backgroundColor: '#ffc107', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
    pointsText: { color: '#ffc107', fontWeight: 'bold', fontSize: 13, marginRight: 4 },

    notificationBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

    // Banner nằm đè lên viền đỏ
    bannerWrapper: {
        paddingHorizontal: 16,
        marginTop: -25, // Kéo banner lên đè vào header
        marginBottom: 16,
    },
    verifyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fce8e8',
        padding: 12,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    verifyIconBg: {
        backgroundColor: '#fff',
        padding: 6,
        borderRadius: 10,
        marginRight: 10
    },
    verifyText: { fontSize: 13, color: '#333', flex: 1 },
    verifyActionText: { color: '#cb1c22', fontWeight: 'bold' },

    // Khối Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5
    },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 15 },

    // Order Steps
    orderSteps: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10, marginTop: 5 },
    stepItem: { alignItems: 'center', width: '30%' },
    stepText: { fontSize: 12, color: '#555', textAlign: 'center', marginTop: 8, fontWeight: '500' },

    divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },

    // Menu Item
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
    menuItemText: { marginLeft: 12, fontSize: 15, color: '#333' },

    // Nút đăng xuất
    logoutButton: {
        marginHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cb1c22',
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 20
    },
    logoutText: { color: '#cb1c22', fontWeight: 'bold', fontSize: 15 }
});