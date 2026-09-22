import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import io from 'socket.io-client';
import axiosClient, { BASE_URL } from '../api/axiosClient';
import * as ImagePicker from 'expo-image-picker';

const SOCKET_URL = 'https://shoptech-api-ytxj.onrender.com/live-chat';

export default function LiveChatScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const user = useAuthStore((state) => state.user);
    const { storeId, storeName, conversationId: passedConvId } = route.params || {};
    
    const [socket, setSocket] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [guestId, setGuestId] = useState('');
    const [conversationId, setConversationId] = useState<string | null>(passedConvId || null);
    const [isUploading, setIsUploading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!storeId) return;

        // Fetch history
        const loadHistory = async () => {
            if (user) {
                try {
                    let cId = conversationId;
                    if (!cId) {
                        const convsRes: any = await axiosClient.get(`/live-chat/user-conversations?userId=${user._id}`);
                        const convs = convsRes.data || [];
                        const existingConv = convs.find((c: any) => c.storeId?._id === storeId || c.storeId === storeId);
                        if (existingConv) {
                            cId = existingConv._id;
                            setConversationId(cId);
                        }
                    }
                    if (cId) {
                        const historyRes: any = await axiosClient.get(`/live-chat/history/${cId}`);
                        setMessages(historyRes.data || []);
                        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
                    }
                } catch (e) {
                    console.log('Error loading history', e);
                }
            }
        };
        loadHistory();

        // Socket setup
        let currentGuestId = '';
        if (!user) {
            currentGuestId = 'guest_' + Math.random().toString(36).substr(2, 9);
            setGuestId(currentGuestId);
        }

        const newSocket = io(SOCKET_URL, { transports: ['websocket'] });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('register', { 
                role: 'user', 
                userId: user?._id, 
                guestId: currentGuestId,
                storeId: storeId 
            });
        });

        newSocket.on('receive_message', (msg: any) => {
            setMessages((prev) => [...prev, msg]);
            if (!conversationId && msg.conversationId) {
                setConversationId(msg.conversationId);
            }
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });

        newSocket.on('message_revoked', (data: any) => {
            setMessages((prev) => 
                prev.map(m => m._id === data.messageId ? { ...m, isRevoked: true } : m)
            );
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user, storeId]);

    const sendMessage = () => {
        if (!input.trim() || !socket || !storeId) return;

        socket.emit('send_message', {
            senderRole: user ? 'user' : 'guest',
            userId: user?._id,
            guestId: guestId,
            storeId: storeId,
            customerName: user ? user.fullName : 'Khách hàng',
            content: input,
            conversationId: conversationId
        });

        setInput('');
    };

    const handleRevoke = (messageId: string) => {
        if (!socket || !user || !storeId) return;
        socket.emit('revoke_message', {
            messageId,
            userId: user._id,
            storeId: storeId
        });
    };

    const onLongPressMessage = (item: any) => {
        if (item.senderRole === 'user' && !item.isRevoked && user) {
            Alert.alert("Thu hồi tin nhắn", "Bạn có chắc chắn muốn thu hồi tin nhắn này không?", [
                { text: "Hủy", style: "cancel" },
                { text: "Thu hồi", onPress: () => handleRevoke(item._id), style: "destructive" }
            ]);
        }
    };

    const pickImage = async () => {
        if (!user) {
            Alert.alert("Thông báo", "Vui lòng đăng nhập để gửi ảnh");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        setIsUploading(true);
        const formData = new FormData();
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('file', {
            uri,
            name: filename || 'image.jpg',
            type
        } as any);

        try {
            const res: any = await axiosClient.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const fullImageUrl = `${BASE_URL}${res.path}`;
            
            socket.emit('send_message', {
                senderRole: 'user',
                userId: user?._id,
                guestId: guestId,
                storeId: storeId,
                customerName: user ? user.fullName : 'Khách hàng',
                content: 'Đã gửi một ảnh',
                imageUrl: fullImageUrl,
                conversationId: conversationId
            });
        } catch (error) {
            console.error('Error uploading image', error);
            Alert.alert("Lỗi", "Không thể gửi ảnh lúc này");
        } finally {
            setIsUploading(false);
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.senderRole === 'user' || item.senderRole === 'guest';
        
        return (
            <TouchableOpacity 
                style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage, item.isRevoked && styles.revokedMessage]}
                onLongPress={() => onLongPressMessage(item)}
                activeOpacity={0.8}
            >
                {item.isRevoked ? (
                    <Text style={[styles.messageText, styles.revokedText]}>Tin nhắn đã bị thu hồi</Text>
                ) : (
                    <>
                        {item.imageUrl && (
                            <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
                        )}
                        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                            {item.content}
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chat với {storeName || 'Cửa hàng'}</Text>
            </View>

            <KeyboardAvoidingView 
                style={styles.chatContainer} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={50} color="#ccc" />
                            <Text style={styles.emptyText}>Bắt đầu trò chuyện với cửa hàng</Text>
                        </View>
                    }
                />

                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachButton} onPress={pickImage} disabled={isUploading}>
                        <Ionicons name="image-outline" size={24} color={isUploading ? "#ccc" : "#007bff"} />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Nhập tin nhắn..."
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity 
                        style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]} 
                        onPress={sendMessage}
                        disabled={!input.trim()}
                    >
                        <Ionicons name="send" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: { padding: 5, marginRight: 10 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    chatContainer: { flex: 1 },
    messageList: { padding: 15, flexGrow: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
    emptyText: { marginTop: 10, fontSize: 14, color: '#333' },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#cb1c22',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#eee',
    },
    revokedMessage: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    messageText: { fontSize: 15, lineHeight: 20 },
    myMessageText: { color: '#fff' },
    theirMessageText: { color: '#333' },
    revokedText: { color: '#888', fontStyle: 'italic', fontSize: 13 },
    messageImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 8 },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
    },
    attachButton: { padding: 8, marginRight: 5 },
    input: {
        flex: 1,
        backgroundColor: '#f1f1f1',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#cb1c22',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    sendButtonDisabled: {
        backgroundColor: '#ffb3b6',
    },
});
