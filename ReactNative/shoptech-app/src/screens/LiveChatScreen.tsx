import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import io from 'socket.io-client';

const SOCKET_URL = 'http://10.0.2.2:5000/live-chat'; // Ensure to use local IP if physical device, or 10.0.2.2 for emulator

export default function LiveChatScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const user = useAuthStore((state) => state.user);
    const { storeId, storeName } = route.params || {};
    
    const [socket, setSocket] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [guestId, setGuestId] = useState('');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!storeId) return;

        // Generate a random guest ID if user is not logged in
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
            // Scroll to bottom
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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
            content: input
        });

        setInput('');
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.senderRole === 'user' || item.senderRole === 'guest';
        return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                    {item.content}
                </Text>
            </View>
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
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={50} color="#ccc" />
                            <Text style={styles.emptyText}>Bắt đầu trò chuyện với nhân viên hỗ trợ</Text>
                        </View>
                    }
                />

                <View style={styles.inputContainer}>
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
                        <Ionicons name="send" size={20} color="#fff" />
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
        paddingTop: 50,
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
        backgroundColor: '#007bff',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#eee',
    },
    messageText: { fontSize: 15, lineHeight: 20 },
    myMessageText: { color: '#fff' },
    theirMessageText: { color: '#333' },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
    },
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    sendButtonDisabled: {
        backgroundColor: '#a0c4ff',
    },
});
