import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axiosClient from '../../api/axiosClient';
import { useOrderStore } from '../../store/orderStore';
import ConfirmModal from '../../components/ConfirmModal';

export default function ShipperDeliveryScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const { updateShipperOrderStatus } = useOrderStore();
    const orderData = route.params?.order;

    const validId = orderData?.subOrderId || orderData?._id || orderData?.id;

    if (!orderData || !validId) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="document-text-outline" size={60} color="#ccc" />
                <Text style={{ marginTop: 16, fontSize: 16, color: '#999' }}>Dữ liệu đơn hàng không hợp lệ!</Text>
                <TouchableOpacity style={{ marginTop: 20, padding: 10, backgroundColor: '#007bff', borderRadius: 8 }} onPress={() => navigation.goBack()}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Quay lại</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const order = {
        id: `#${String(validId).slice(-6).toUpperCase()}`,
        pickupAddress: orderData.store?.address || orderData.pickupAddress || 'Chưa có thông tin cửa hàng',
        deliveryAddress: orderData.shippingAddress || orderData.deliveryAddress || 'Chưa có thông tin giao hàng',
        price: `${(orderData.grandTotal || 0).toLocaleString('vi-VN')} đ`,
        subOrderId: validId,
        status: orderData.status
    };

    const getInitialStatus = () => {
        if (order.status === 'Processing') return 0;
        if (order.status === 'Shipped') return 1;
        if (order.status === 'Delivered') return 2;
        return 0;
    };

    const [deliveryStatus, setDeliveryStatus] = useState(getInitialStatus());
    const [isUpdating, setIsUpdating] = useState(false);
    
    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: '',
        message: '',
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
        hideCancel: false,
        iconName: 'help-circle-outline' as any,
        iconColor: '#007bff',
        confirmColor: '#007bff',
        onConfirm: () => {},
    });

    const closeConfirmModal = () => setModalConfig(prev => ({ ...prev, visible: false }));

    const handleUpdateStatus = () => {
        if (deliveryStatus === 0) {
            setModalConfig({
                visible: true,
                title: 'Xác nhận',
                message: 'Bạn đã lấy hàng từ cửa hàng thành công?',
                cancelText: 'Hủy',
                confirmText: 'Xác nhận',
                hideCancel: false,
                iconName: 'cube-outline',
                iconColor: '#007bff',
                confirmColor: '#007bff',
                onConfirm: async () => {
                    closeConfirmModal();
                    setIsUpdating(true);
                    const success = await updateShipperOrderStatus(order.subOrderId, 'Shipped');
                    setIsUpdating(false);

                    if (success) {
                        setDeliveryStatus(1);
                    } else {
                        Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại!');
                    }
                }
            });
        } else if (deliveryStatus === 1) {
            setModalConfig({
                visible: true,
                title: 'Xác nhận',
                message: 'Khách hàng đã nhận được hàng và thanh toán?',
                cancelText: 'Chưa',
                confirmText: 'Đã giao xong',
                hideCancel: false,
                iconName: 'checkmark-circle-outline',
                iconColor: '#28a745',
                confirmColor: '#28a745',
                onConfirm: async () => {
                    closeConfirmModal();
                    setIsUpdating(true);
                    
                    const success = await updateShipperOrderStatus(order.subOrderId, 'Delivered');
                    setIsUpdating(false);

                    if (success) {
                        setDeliveryStatus(2);
                    } else {
                        Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại!');
                    }
                }
            });
        }
    };

    const handleFinish = () => {
        setModalConfig({
            visible: true,
            title: 'Hoàn thành',
            message: 'Tuyệt vời! Đơn hàng đã được ghi nhận thành công.',
            confirmText: 'Về danh sách',
            cancelText: '',
            hideCancel: true,
            iconName: 'trophy-outline',
            iconColor: '#d70018',
            confirmColor: '#d70018',
            onConfirm: () => {
                closeConfirmModal();
                navigation.goBack();
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết vận chuyển</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.orderCard}>
                    <View style={styles.orderHeaderRow}>
                        <Text style={styles.orderId}>{order.id}</Text>
                        <Text style={styles.orderPrice}>{order.price}</Text>
                    </View>
                    <View style={styles.orderInfoRow}>
                        <Ionicons name="storefront-outline" size={18} color="#007bff" style={{ marginTop: 2 }} />
                        <Text style={styles.infoText}><Text style={styles.infoLabel}>Lấy hàng: </Text>{order.pickupAddress}</Text>
                    </View>
                    <View style={styles.orderInfoRow}>
                        <Ionicons name="location-outline" size={18} color="#d70018" style={{ marginTop: 2 }} />
                        <Text style={styles.infoText}><Text style={styles.infoLabel}>Giao đến: </Text>{(order.deliveryAddress || '').replace(/, undefined/g, '').replace(/undefined/g, '')}</Text>
                    </View>
                </View>

                <View style={styles.timelineContainer}>
                    <Text style={styles.timelineTitle}>Trạng thái đơn hàng</Text>

                    <View style={styles.step}>
                        <View style={styles.stepIndicator}>
                            <View style={[styles.stepDot, { backgroundColor: deliveryStatus >= 0 ? '#28a745' : '#ccc' }]} />
                            <View style={[styles.stepLine, { backgroundColor: deliveryStatus >= 1 ? '#28a745' : '#ccc' }]} />
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={[styles.stepTitle, { color: deliveryStatus >= 0 ? '#28a745' : '#666' }]}>Đã nhận đơn</Text>
                            <Text style={styles.stepDesc}>Tài xế đang di chuyển đến điểm lấy hàng.</Text>
                        </View>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepIndicator}>
                            <View style={[styles.stepDot, { backgroundColor: deliveryStatus >= 1 ? '#007bff' : '#ccc' }]} />
                            <View style={[styles.stepLine, { backgroundColor: deliveryStatus >= 2 ? '#007bff' : '#ccc' }]} />
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={[styles.stepTitle, { color: deliveryStatus >= 1 ? '#007bff' : '#666' }]}>Đã lấy hàng</Text>
                            <Text style={styles.stepDesc}>Kiểm tra hàng hóa và bắt đầu đi giao cho khách.</Text>
                        </View>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepIndicator}>
                            <View style={[styles.stepDot, { backgroundColor: deliveryStatus === 2 ? '#d70018' : '#ccc' }]} />
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={[styles.stepTitle, { color: deliveryStatus === 2 ? '#d70018' : '#666' }]}>Giao hàng thành công</Text>
                            <Text style={styles.stepDesc}>Khách hàng đã nhận và thanh toán đầy đủ.</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                {deliveryStatus === 0 && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#007bff' }]} onPress={handleUpdateStatus} disabled={isUpdating}>
                        {isUpdating ? (
                            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                        ) : (
                            <Ionicons name="checkmark-done-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                        )}
                        <Text style={styles.actionBtnText}>{isUpdating ? 'ĐANG XỬ LÝ...' : 'TÔI ĐÃ LẤY HÀNG'}</Text>
                    </TouchableOpacity>
                )}

                {deliveryStatus === 1 && (
                    <View>
                        <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: '#28a745' }]} 
                            onPress={handleUpdateStatus} 
                            disabled={isUpdating}
                        >
                            {isUpdating ? (
                                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                            ) : (
                                <Ionicons name="gift-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                            )}
                            <Text style={styles.actionBtnText}>{isUpdating ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐÃ GIAO XONG'}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {deliveryStatus === 2 && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#d70018' }]} onPress={handleFinish}>
                        <Ionicons name="home-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.actionBtnText}>VỀ TRANG CHỦ</Text>
                    </TouchableOpacity>
                )}
            </View>
            <ConfirmModal 
                visible={modalConfig.visible}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
                hideCancel={modalConfig.hideCancel}
                iconName={modalConfig.iconName}
                iconColor={modalConfig.iconColor}
                confirmColor={modalConfig.confirmColor}
                onConfirm={modalConfig.onConfirm}
                onCancel={closeConfirmModal}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f8' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#eee'
    },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    scrollContent: { padding: 15 },
    orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
    orderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderColor: '#f0f0f0', paddingBottom: 8 },
    orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    orderPrice: { fontSize: 16, fontWeight: 'bold', color: '#d70018' },
    orderInfoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
    infoText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
    infoLabel: { fontWeight: 'bold', color: '#555' },
    timelineContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 2 },
    timelineTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    step: { flexDirection: 'row', alignItems: 'flex-start' },
    stepIndicator: { alignItems: 'center', marginRight: 15, width: 20 },
    stepDot: { width: 14, height: 14, borderRadius: 7, zIndex: 2 },
    stepLine: { width: 2, height: 50, marginTop: -2, zIndex: 1 },
    stepContent: { flex: 1, paddingBottom: 25, marginTop: -4 },
    stepTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    stepDesc: { fontSize: 13, color: '#666', lineHeight: 18 },
    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 8, elevation: 2 },
    actionBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});