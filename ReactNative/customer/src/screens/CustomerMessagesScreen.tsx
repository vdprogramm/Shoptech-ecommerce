import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import axiosClient, { BASE_URL } from '../api/axiosClient';

export default function CustomerMessagesScreen() {
    const navigation = useNavigation<any>();
    const user = useAuthStore((state) => state.user);
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchConversations = async () => {
        if (!user) return;
        try {
            const response: any = await axiosClient.get(`/live-chat/user-conversations?userId=${user._id}`);
            if (response.data) {
                setConversations(response.data);
            }
        } catch (error) {
            console.error('Error fetching user conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchConversations();
        }, [user])
    );

    const renderItem = ({ item }: { item: any }) => {
        const store = item.storeId;
        const logo = store?.logoUrl ? (store.logoUrl.startsWith('http') ? store.logoUrl : `${BASE_URL}${store.logoUrl}`) : null;

        return (
            <TouchableOpacity 
                style={styles.conversationItem}
                onPress={() => navigation.navigate('LiveChat', { storeId: store?._id, storeName: store?.name })}
            >
                <View style={styles.avatarContainer}>
                    {logo ? (
                        <Image source={{ uri: logo }} style={styles.avatar} />
                    ) : (
                        <Ionicons name="storefront" size={24} color="#888" />
                    )}
                </View>
                <View style={styles.contentContainer}>
                    <Text style={styles.storeName} numberOfLines={1}>{store?.name || 'Cửa hàng'}</Text>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.lastMessage || 'Chưa có tin nhắn'}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
        );
    };

    if (!user) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="lock-closed-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Vui lòng đăng nhập để xem tin nhắn</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={conversations}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                refreshing={loading}
                onRefresh={fetchConversations}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.centerContainer}>
                            <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>Bạn chưa có cuộc trò chuyện nào</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f8' },
    listContainer: { padding: 15 },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
    },
    avatar: { width: '100%', height: '100%' },
    contentContainer: { flex: 1 },
    storeName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    lastMessage: { fontSize: 13, color: '#888' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 10, fontSize: 14, color: '#888' },
});
