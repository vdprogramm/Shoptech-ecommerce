import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Modal, TextInput, Image, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useOrderStore } from '../store/orderStore'; // Import Store
import axiosClient from '../api/axiosClient';

const TABS = [
    { id: 'ALL', title: 'Tất cả' },
    { id: 'PROCESSING', title: 'Đang xử lý' },
    { id: 'SHIPPING', title: 'Đang vận chuyển' },
    { id: 'COMPLETED', title: 'Hoàn tất' },
    { id: 'CANCELLED', title: 'Đã hủy' }
];

export default function MyOrdersScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const initialTab = route.params?.activeTab || 'ALL';
    const [activeTab, setActiveTab] = useState(initialTab);

    // States for review
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

    // Rút dữ liệu từ Store
    const { orders, isLoading, fetchMyOrders, cancelOrder } = useOrderStore();

    useEffect(() => {
        fetchMyOrders();
    }, []);

    const handleSubmitReview = async () => {
        if (!selectedProduct) return;
        if (!comment.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập nội dung đánh giá");
            return;
        }

        try {
            setIsSubmittingReview(true);
            const productId = selectedProduct._id || selectedProduct.id;

            await axiosClient.post('/reviews', {
                productId,
                rating,
                comment
            });

            setReviewedIds(prev => new Set(prev).add(productId));
            Alert.alert("Thành công", "Cảm ơn bạn đã đánh giá sản phẩm!");
            setReviewModalVisible(false);
            setRating(5);
            setComment('');
        } catch (error: any) {
            console.log('Submit review error:', error);

            // 👉 CẬP NHẬT DÒNG NÀY: Lấy trực tiếp error.message vì axiosClient đã bóc vỏ sẵn rồi
            const errorMessage = error.message || error.response?.data?.message || "Không thể gửi đánh giá lúc này";

            Alert.alert("Thông báo", errorMessage);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const getOrderStatusInfo = (order: any) => {
        if (!order.subOrders || order.subOrders.length === 0) {
            return { id: 'PROCESSING', text: 'Đang xử lý', isDone: false, isCancelled: false };
        }

        const allDelivered = order.subOrders.every((sub: any) => sub.status === 'Delivered');
        if (allDelivered) return { id: 'COMPLETED', text: 'Đã giao', isDone: true, isCancelled: false };

        const allCancelled = order.subOrders.every((sub: any) => sub.status === 'Cancelled');
        if (allCancelled) return { id: 'CANCELLED', text: 'Đã hủy', isDone: false, isCancelled: true };

        const isShipped = order.subOrders.some((sub: any) => sub.status === 'Shipped');
        if (isShipped) return { id: 'SHIPPING', text: 'Đang giao', isDone: false, isCancelled: false };

        const isProcessing = order.subOrders.some((sub: any) => sub.status === 'Processing');
        if (isProcessing) return { id: 'PROCESSING', text: 'Đang chuẩn bị', isDone: false, isCancelled: false };

        return { id: 'PROCESSING', text: 'Chờ xác nhận', isDone: false, isCancelled: false };
    };

    const handleCancelSubOrder = (subOrderId: string) => {
        Alert.alert(
            "Hủy đơn hàng",
            "Bạn có chắc chắn muốn hủy đơn hàng này không?",
            [
                { text: "Không", style: "cancel" },
                {
                    text: "Có, hủy đơn",
                    style: "destructive",
                    onPress: async () => {
                        const success = await cancelOrder(subOrderId);
                        if (success) {
                            Alert.alert("Thành công", "Đã hủy đơn hàng thành công");
                            fetchMyOrders(); // Tải lại danh sách đơn hàng
                        } else {
                            Alert.alert("Lỗi", "Không thể hủy đơn hàng lúc này");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        const statusInfo = getOrderStatusInfo(item);

        let statusStyle = styles.statusPending;
        if (statusInfo.isDone) statusStyle = styles.statusDone;
        else if (statusInfo.isCancelled) statusStyle = styles.statusCancelled;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    {/* Lấy 8 ký tự cuối của ID cho đẹp nếu xài MongoDB */}
                    <Text style={styles.orderId}>Mã ĐH: {item._id?.slice(-8).toUpperCase() || item.id}</Text>
                    <Text style={[styles.status, statusStyle]}>
                        {statusInfo.text}
                    </Text>
                </View>
                <Text style={styles.date}>Ngày đặt: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
                <Text style={styles.total}>Tổng tiền: {(item.totalAmount || item.total || 0).toLocaleString('vi-VN')} VNĐ</Text>

                {/* Render danh sách các đơn hàng con (subOrders) */}
                {item.subOrders && item.subOrders.length > 0 && (
                    <View style={styles.subOrdersContainer}>
                        <Text style={styles.subOrdersTitle}>Chi tiết đơn hàng:</Text>
                        {item.subOrders.map((sub: any, index: number) => (
                            <View key={sub._id || index} style={styles.subOrderCard}>
                                <View style={styles.subOrderHeader}>
                                    <Text style={styles.subOrderStore}>🛒 {sub.store?.name || 'Cửa hàng'}</Text>
                                    <Text style={[styles.subOrderStatus, sub.status === 'Cancelled' ? styles.statusCancelled : (sub.status === 'Delivered' ? styles.statusDone : styles.statusPending)]}>
                                        {sub.status}
                                    </Text>
                                </View>
                                <Text style={styles.subOrderText}>Số lượng sản phẩm: {sub.items?.length || 0}</Text>
                                <Text style={styles.subOrderText}>Thành tiền: {sub.grandTotal?.toLocaleString('vi-VN')} VNĐ</Text>

                                <View style={styles.itemsList}>
                                    {sub.items?.map((item: any, itemIndex: number) => {
                                        const product = item.product || {};
                                        const productId = product._id || product.id || item.product;
                                        const isReviewed = reviewedIds.has(productId);
                                        const itemName = item.name && item.name !== 'Sản phẩm' ? item.name : (product.name || 'Sản phẩm');
                                        const itemImage = item.image || product.images?.[0];

                                        return (
                                            <View key={itemIndex} style={styles.productItem}>
                                                {itemImage ? (
                                                    <Image source={{ uri: itemImage }} style={styles.productImage} />
                                                ) : (
                                                    <View style={styles.productImagePlaceholder} />
                                                )}
                                                <View style={styles.productInfo}>
                                                    <Text style={styles.productName} numberOfLines={2}>{itemName}</Text>
                                                    <Text style={styles.productPrice}>{item.price?.toLocaleString('vi-VN')} VNĐ x {item.quantity}</Text>
                                                </View>
                                                {sub.status === 'Delivered' && (
                                                    <TouchableOpacity
                                                        style={[styles.reviewBtn, isReviewed && styles.reviewedBtn]}
                                                        disabled={isReviewed}
                                                        onPress={() => {
                                                            if (!isReviewed) {
                                                                setSelectedProduct({
                                                                    _id: productId,
                                                                    name: itemName,
                                                                    images: itemImage ? [itemImage] : []
                                                                });
                                                                setRating(5);
                                                                setComment('');
                                                                setReviewModalVisible(true);
                                                            }
                                                        }}
                                                    >
                                                        <Text style={[styles.reviewBtnText, isReviewed && styles.reviewedBtnText]}>
                                                            {isReviewed ? 'Đã đánh giá' : 'Đánh giá'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* Nút hủy đơn hàng chỉ hiển thị khi trạng thái là Pending */}
                                {sub.status === 'Pending' && (
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelSubOrder(sub._id)}>
                                        <Text style={styles.cancelBtnText}>Hủy đơn con này</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const filteredOrders = orders?.filter((order: any) => {
        if (activeTab === 'ALL') return true;
        const statusInfo = getOrderStatusInfo(order);
        return statusInfo.id === activeTab;
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Tabs ScrollView */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tabButton, activeTab === tab.id && styles.activeTabButton]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                                {tab.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item._id || item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 15, paddingBottom: 40 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>Không có đơn hàng nào.</Text>}
                />
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={reviewModalVisible}
                onRequestClose={() => setReviewModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Đánh giá sản phẩm</Text>
                            <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {selectedProduct && (
                            <View style={styles.reviewProductInfo}>
                                {selectedProduct.images?.[0] ? (
                                    <Image source={{ uri: selectedProduct.images[0] }} style={styles.reviewProductImage} />
                                ) : (
                                    <View style={styles.reviewProductImagePlaceholder} />
                                )}
                                <Text style={styles.reviewProductName} numberOfLines={2}>{selectedProduct.name}</Text>
                            </View>
                        )}

                        <View style={styles.ratingContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                    <Ionicons
                                        name={star <= rating ? "star" : "star-outline"}
                                        size={32}
                                        color="#FFD700"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={styles.commentInput}
                            placeholder="Hãy chia sẻ nhận xét của bạn về sản phẩm này..."
                            multiline
                            numberOfLines={4}
                            value={comment}
                            onChangeText={setComment}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={[styles.submitReviewBtn, isSubmittingReview && { opacity: 0.7 }]}
                            onPress={handleSubmitReview}
                            disabled={isSubmittingReview}
                        >
                            {isSubmittingReview ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitReviewText}>Gửi đánh giá</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { 
        backgroundColor: '#cb1c22', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: 20, 
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50 
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    tabsContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    tabsScroll: { paddingHorizontal: 10, paddingVertical: 10 },
    tabButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#f0f0f0' },
    activeTabButton: { backgroundColor: '#cb1c22' },
    tabText: { fontSize: 14, color: '#666', fontWeight: '500' },
    activeTabText: { color: '#fff', fontWeight: 'bold' },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    status: { fontSize: 14, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
    statusDone: { backgroundColor: '#d4edda', color: '#28a745' },
    statusPending: { backgroundColor: '#fff3cd', color: '#856404' },
    statusCancelled: { backgroundColor: '#f8d7da', color: '#721c24' },
    date: { fontSize: 14, color: '#666', marginBottom: 5 },
    total: { fontSize: 16, fontWeight: 'bold', color: '#dc3545' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 },
    subOrdersContainer: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
    subOrdersTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    subOrderCard: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
    subOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    subOrderStore: { fontSize: 14, fontWeight: 'bold', color: '#cb1c22' },
    subOrderStatus: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
    subOrderText: { fontSize: 13, color: '#555', marginBottom: 3 },
    cancelBtn: { marginTop: 8, backgroundColor: '#dc3545', paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
    cancelBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

    // Items list in sub order
    itemsList: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
    productItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    productImage: { width: 50, height: 50, borderRadius: 6, backgroundColor: '#eee', marginRight: 10 },
    productImagePlaceholder: { width: 50, height: 50, borderRadius: 6, backgroundColor: '#eee', marginRight: 10 },
    productInfo: { flex: 1 },
    productName: { fontSize: 13, color: '#333', fontWeight: '500', marginBottom: 4 },
    productPrice: { fontSize: 12, color: '#666' },
    reviewBtn: { backgroundColor: '#ff6600', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
    reviewBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    reviewedBtn: { backgroundColor: '#ccc' },
    reviewedBtnText: { color: '#666' },

    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    reviewProductInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    reviewProductImage: { width: 40, height: 40, borderRadius: 4, marginRight: 10 },
    reviewProductImagePlaceholder: { width: 40, height: 40, borderRadius: 4, marginRight: 10, backgroundColor: '#eee' },
    reviewProductName: { flex: 1, fontSize: 14, color: '#333' },
    ratingContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 10 },
    commentInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, height: 100, marginBottom: 20, fontSize: 14, color: '#333' },
    submitReviewBtn: { backgroundColor: '#cb1c22', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    submitReviewText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});