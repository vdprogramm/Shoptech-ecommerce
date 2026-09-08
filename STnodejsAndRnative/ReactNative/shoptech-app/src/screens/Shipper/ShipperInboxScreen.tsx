import React, { useState, useEffect } from 'react';
import { Platform,  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, StatusBar  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axiosClient from '../../api/axiosClient';

export default function ShipperInboxScreen() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const response: any = await axiosClient.get('/notifications/me');
            setNotifications(response.data || response);
        } catch (error) {
            console.error('Lỗi lấy thông báo:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        try {
            await axiosClient.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Lỗi đánh dấu đã đọc:', error);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
            onPress={() => markAsRead(item._id, item.isRead)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <View style={[styles.iconWrap, !item.isRead ? styles.iconWrapUnread : styles.iconWrapRead]}>
                    <Ionicons name="notifications" size={20} color={!item.isRead ? "#fff" : "#888"} />
                </View>
            </View>
            <View style={styles.contentContainer}>
                <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
                <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
                <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />

            {/* HEADER PHONG CÁCH FPT SHOP */}
            <LinearGradient colors={['#cb1c22', '#f43f5e']} style={styles.header}>
                <Text style={styles.headerTitle}>Hộp thư</Text>
                <Text style={styles.headerSub}>Cập nhật thông báo hệ thống và đơn hàng</Text>
            </LinearGradient>

            <View style={styles.container}>
                {isLoading && !refreshing ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#cb1c22" />
                        <Text style={{ marginTop: 10, color: '#666' }}>Đang tải thông báo...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item._id || Math.random().toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#cb1c22']} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconBg}>
                                    <Ionicons name="mail-open-outline" size={60} color="#ccc" />
                                </View>
                                <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
                                <Text style={styles.emptySubText}>Các thông báo về đơn hàng mới hoặc thay đổi trạng thái sẽ xuất hiện tại đây.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#cb1c22' }, // Đỏ đặc trưng
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

    // Notification Card
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    unreadCard: {
        backgroundColor: '#fffcfc', // Đỏ cực nhạt để nổi bật
        borderColor: '#fce8e8',
    },

    // Icon
    iconContainer: { marginRight: 15 },
    iconWrap: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center'
    },
    iconWrapUnread: {
        backgroundColor: '#cb1c22',
        shadowColor: '#cb1c22',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4
    },
    iconWrapRead: { backgroundColor: '#f0f0f0' },

    // Content
    contentContainer: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 15, fontWeight: '600', color: '#444', marginBottom: 4 },
    unreadText: { fontWeight: 'bold', color: '#cb1c22' },
    message: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 8 },
    time: { fontSize: 12, color: '#999', fontWeight: '500' },

    // Unread Dot Indicator
    unreadDot: {
        width: 10, height: 10, borderRadius: 5, backgroundColor: '#cb1c22',
        position: 'absolute', top: 15, right: 15
    },

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