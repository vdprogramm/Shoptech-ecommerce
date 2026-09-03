import React, { useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore, Notification } from '../store/notificationStore';

export default function NotificationScreen() {
    const navigation = useNavigation<any>();
    const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

    // Tải lại mỗi khi mở màn hình
    useFocusEffect(
        useCallback(() => {
            fetchNotifications();
        }, [])
    );

    const handlePressItem = (item: Notification) => {
        // Đánh dấu đã đọc nếu chưa đọc
        if (!item.isRead) {
            markAsRead(item._id);
        }

        // Nếu thông báo liên quan đến đơn hàng, điều hướng đến trang đơn hàng
        if (item.orderId) {
            navigation.navigate('MyOrders');
        }
    };

    const getIconName = (title: string): any => {
        const t = title.toLowerCase();
        if (t.includes('đơn hàng') || t.includes('order')) return 'receipt-outline';
        if (t.includes('giao') || t.includes('vận chuyển')) return 'bicycle-outline';
        if (t.includes('thanh toán')) return 'card-outline';
        if (t.includes('khuyến mãi') || t.includes('sale') || t.includes('flash')) return 'flash-outline';
        if (t.includes('voucher') || t.includes('giảm giá')) return 'ticket-outline';
        return 'notifications-outline';
    };

    const getTimeAgo = (dateStr: string) => {
        const now = Date.now();
        const diff = now - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        return `${days} ngày trước`;
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.card, !item.isRead && styles.cardUnread]}
            onPress={() => handlePressItem(item)}
            activeOpacity={0.75}
        >
            {/* Icon loại thông báo */}
            <View style={[styles.iconWrapper, !item.isRead && styles.iconWrapperUnread]}>
                <Ionicons
                    name={getIconName(item.title)}
                    size={22}
                    color={item.isRead ? '#999' : '#d70018'}
                />
            </View>

            {/* Nội dung thông báo */}
            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    {!item.isRead && <View style={styles.badge} />}
                </View>
                <Text style={styles.message} numberOfLines={2}>
                    {item.message}
                </Text>
                <Text style={styles.time}>{getTimeAgo(item.createdAt)}</Text>
            </View>

            {/* Chevron nếu có link đơn hàng */}
            {item.orderId && (
                <Ionicons name="chevron-forward" size={16} color="#ccc" style={styles.arrow} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={26} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông báo</Text>
                {unreadCount > 0 ? (
                    <TouchableOpacity onPress={markAllAsRead} style={styles.readAllBtn}>
                        <Text style={styles.readAllText}>Đọc hết</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 60 }} />
                )}
            </View>

            {/* Badge tổng thông báo chưa đọc */}
            {unreadCount > 0 && (
                <View style={styles.unreadBanner}>
                    <Ionicons name="ellipse" size={10} color="#fff" />
                    <Text style={styles.unreadBannerText}>
                        Bạn có {unreadCount} thông báo chưa đọc
                    </Text>
                </View>
            )}

            {isLoading && notifications.length === 0 ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#d70018" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={fetchNotifications}
                            colors={['#d70018']}
                        />
                    }
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={80} color="#ddd" />
                            <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
                            <Text style={styles.emptySubtitle}>
                                Các cập nhật về đơn hàng và khuyến mãi sẽ xuất hiện ở đây
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
    },
    header: {
        backgroundColor: '#d70018',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 15,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    readAllBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    readAllText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    unreadBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ff4757',
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    unreadBannerText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingVertical: 10,
        flexGrow: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 14,
    },
    cardUnread: {
        backgroundColor: '#fff5f5',
        borderLeftWidth: 3,
        borderLeftColor: '#d70018',
    },
    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f2f2f2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        flexShrink: 0,
    },
    iconWrapperUnread: {
        backgroundColor: '#ffeef0',
    },
    content: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    title: {
        fontSize: 14,
        color: '#888',
        fontWeight: '500',
        flex: 1,
    },
    titleUnread: {
        color: '#1a1a1a',
        fontWeight: '700',
    },
    badge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#d70018',
        flexShrink: 0,
    },
    message: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 5,
    },
    time: {
        fontSize: 11,
        color: '#aaa',
    },
    arrow: {
        marginLeft: 8,
        flexShrink: 0,
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#888',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#aaa',
        textAlign: 'center',
        lineHeight: 20,
    },
});
