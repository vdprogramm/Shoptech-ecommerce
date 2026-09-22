import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
    StatusBar, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import aiApi from '../api/aiApi';
import { useAiStore } from '../store/aiStore';
import { useFlashSaleStore } from '../store/flashSaleStore';
import { useVoucherStore } from '../store/voucherStore';

const MessageImage = ({ url }: { url: string }) => {
    const [hasError, setHasError] = useState(false);

    let finalUrl = url ? url.trim() : '';

    if (!finalUrl || finalUrl === 'null' || finalUrl === 'undefined' || finalUrl === '') {
        return (
            <View style={[styles.messageImage, { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={40} color="#ccc" />
                <Text style={{ color: '#999', fontSize: 12, marginTop: 5 }}>Không có ảnh</Text>
            </View>
        );
    }

    else if (finalUrl.includes('localhost')) {
        finalUrl = finalUrl.replace('localhost', '10.0.2.2');
    }

    else if (finalUrl.startsWith('/')) {
        finalUrl = `http://10.0.2.2:8080${finalUrl}`;
    }

    console.log("📸 [DEBUG ChatAI] Link ảnh chuẩn bị load:", finalUrl);

    if (hasError) {
        return (
            <View style={[styles.messageImage, { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={40} color="#ccc" />
                <Text style={{ color: '#999', fontSize: 12, marginTop: 5 }}>Ảnh bị lỗi</Text>
            </View>
        );
    }

    return (
        <View>
            <Image
                source={{ uri: finalUrl }}
                style={[styles.messageImage, { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' }]}
                resizeMode="cover"
                onError={(e) => {
                    console.log('❌ [DEBUG ChatAI] TẢI ẢNH THẤT BẠI. Đã bật ảnh dự phòng!');
                    setHasError(true);
                }}
            />
            <Text style={{ fontSize: 10, color: 'gray', maxWidth: 200 }}>{finalUrl}</Text>
        </View>
    );
};

const ChatAIScreen = () => {
    const [input, setInput] = useState('');
    const { messages, addMessage, isLoading, setIsLoading } = useAiStore();
    const navigation = useNavigation<any>();

    const { currentSale, fetchCurrentSale } = useFlashSaleStore();
    const { vouchers, fetchPublicVouchers } = useVoucherStore();

    useEffect(() => {
        fetchCurrentSale();
        fetchPublicVouchers();
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');

        // 👉 ĐÃ SỬA CHỖ NÀY: Trích xuất tối đa 6 tin nhắn gần nhất làm "Ký ức"
        const chatHistory: any[] = messages
            .filter((m: any) => m.role !== 'error') // Bỏ qua các câu báo lỗi mạng
            .slice(-6) // Lấy 6 câu chat gần nhất
            .map((msg: any) => ({ role: msg.role, content: msg.content })); // Chỉ lấy role và content

        // 👉 TẠO NGỮ CẢNH HỆ THỐNG VỀ KHUYẾN MÃI
        let systemContext = "Dữ liệu ngữ cảnh thời gian thực của cửa hàng:\n";
        if (currentSale && currentSale.isActive) {
            let itemsDetails = "";
            if (currentSale.items && currentSale.items.length > 0) {
                const itemList = currentSale.items.map((item: any) => {
                    const productName = item.variant?.product?.name || item.variant?.name || "Sản phẩm";
                    const originalPrice = item.variant?.price;
                    const priceText = originalPrice ? `Giá gốc: ${originalPrice.toLocaleString()}đ, Giá sale: ${item.salePrice.toLocaleString()}đ` : `Giá sale: ${item.salePrice.toLocaleString()}đ`;
                    return `${productName} (${priceText})`;
                }).join('; ');
                itemsDetails = ` Các sản phẩm chi tiết: ${itemList}. (AI LƯU Ý: Vui lòng cung cấp link hình ảnh rõ ràng và đúng sản phẩm).`;
            }
            systemContext += `- Chương trình Flash Sale đang diễn ra: "${currentSale.campaignName}". Có ${currentSale.items?.length || 0} sản phẩm đang giảm giá.${itemsDetails}\n`;
        } else {
            systemContext += "- Hiện tại không có chương trình Flash Sale nào.\n";
        }

        if (vouchers && vouchers.length > 0) {
            const voucherList = vouchers.map((v: any) => `${v.code} (Giảm ${v.discountType === 'percent' ? v.discountAmount + '%' : v.discountAmount.toLocaleString() + 'đ'})`).join(', ');
            systemContext += `- Các mã giảm giá (voucher) đang có sẵn: ${voucherList}.\n`;
        } else {
            systemContext += "- Hiện tại không có mã giảm giá nào.\n";
        }
        systemContext += "Hãy sử dụng thông tin trên để tư vấn cho khách hàng nếu họ hỏi về khuyến mãi, giảm giá, flash sale hoặc voucher.";

        chatHistory.unshift({ role: "user", content: `[LƯU Ý DÀNH CHO AI - THÔNG TIN TỪ HỆ THỐNG]:\n${systemContext}` });

        addMessage({ role: 'user', content: userMsg });
        setIsLoading(true);

        try {
            // 👉 ĐÃ SỬA CHỖ NÀY: Gửi kèm chatHistory xuống cho Backend
            const response: any = await aiApi.chatWithAI(userMsg, chatHistory);
            const aiResponse = response.reply || (response.data && response.data.reply) || "Lỗi dữ liệu";

            addMessage({ role: 'ai', content: aiResponse });

        } catch (error) {
            addMessage({ role: 'ai', content: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.' });
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageContent = (text: string, isUser: boolean) => {
        if (isUser) {
            return <Text style={[styles.text, styles.userText]}>{text}</Text>;
        }

        const tokens: any[] = [];
        const regex = /(!\[[^\]]*\]\([^)]+\))|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                tokens.push({ type: 'text', content: text.substring(lastIndex, match.index) });
            }
            const matchStr = match[0];
            if (matchStr.startsWith('![')) {
                const altMatch = matchStr.match(/!\[([^\]]*)\]/);
                const urlMatch = matchStr.match(/\(([^)]+)\)/);
                tokens.push({ type: 'image', alt: altMatch ? altMatch[1] : '', url: urlMatch ? urlMatch[1].trim() : '' });
            } else if (matchStr.startsWith('[')) {
                const textMatch = matchStr.match(/\[([^\]]+)\]/);
                const urlMatch = matchStr.match(/\(([^)]+)\)/);
                tokens.push({ type: 'link', text: textMatch ? textMatch[1] : '', url: urlMatch ? urlMatch[1].trim() : '' });
            } else if (matchStr.startsWith('**')) {
                const boldMatch = matchStr.match(/\*\*([^*]+)\*\*/);
                tokens.push({ type: 'bold', text: boldMatch ? boldMatch[1] : '' });
            }
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < text.length) {
            tokens.push({ type: 'text', content: text.substring(lastIndex) });
        }

        const elements: any[] = [];
        let currentTextGroup: any[] = [];

        const flushTextGroup = () => {
            if (currentTextGroup.length > 0) {
                elements.push(
                    <Text key={`textGroup_${elements.length}`} style={[styles.text, styles.aiText]}>
                        {currentTextGroup}
                    </Text>
                );
                currentTextGroup = [];
            }
        };

        tokens.forEach((token, index) => {
            if (token.type === 'text') {
                currentTextGroup.push(<Text key={index}>{token.content}</Text>);
            } else if (token.type === 'bold') {
                currentTextGroup.push(<Text key={index} style={{ fontWeight: 'bold' }}>{token.text}</Text>);
            } else if (token.type === 'image') {
                flushTextGroup();
                elements.push(
                    <MessageImage key={`img_${index}`} url={token.url} />
                );
            } else if (token.type === 'link') {
                flushTextGroup();
                let onPress = () => { };
                if (token.url?.includes('/product/')) {
                    const parts = token.url.split('/product/');
                    const productId = parts[1]?.split('?')[0];
                    if (productId) {
                        onPress = () => navigation.navigate('ProductDetail', { productId });
                    }
                }
                elements.push(
                    <TouchableOpacity key={`link_${index}`} style={styles.linkButton} onPress={onPress} activeOpacity={0.8}>
                        <Text style={styles.linkButtonText}>{token.text}</Text>
                    </TouchableOpacity>
                );
            }
        });

        flushTextGroup();

        return <View>{elements}</View>;
    };

    const renderMessageItem = ({ item }: { item: any }) => {
        const isUser = item.role === 'user';

        return (
            <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAI]}>
                {/* Avatar AI */}
                {!isUser && (
                    <View style={styles.aiAvatar}>
                        <MaterialCommunityIcons name="robot-outline" size={20} color="#cb1c22" />
                    </View>
                )}

                {/* Bong bóng chat */}
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                    {renderMessageContent(item.content, isUser)}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />

            {/* Header phong cách FPT Shop */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Trợ lý AI</Text>
                    <View style={styles.onlineIndicator}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>Đang hoạt động</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.menuBtn}>
                    <Ionicons name="ellipsis-horizontal-circle-outline" size={26} color="#fff" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <FlatList
                    data={messages}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={renderMessageItem}
                    contentContainerStyle={styles.chatList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="robot-happy-outline" size={80} color="#e0e0e0" />
                            <Text style={styles.emptyText}>Xin chào! Tôi có thể giúp gì cho bạn hôm nay?</Text>
                        </View>
                    }
                />

                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <View style={styles.aiAvatarSmall}>
                            <MaterialCommunityIcons name="robot-outline" size={16} color="#cb1c22" />
                        </View>
                        <View style={styles.typingBubble}>
                            <ActivityIndicator color="#cb1c22" size="small" />
                            <Text style={styles.typingText}>AI đang trả lời...</Text>
                        </View>
                    </View>
                )}

                {/* Khu vực nhập liệu */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Nhập câu hỏi tại đây..."
                        placeholderTextColor="#999"
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !input.trim() ? styles.sendButtonDisabled : null]}
                        onPress={handleSend}
                        disabled={!input.trim() || isLoading}
                    >
                        <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 3 }} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#cb1c22' },
    container: { flex: 1, backgroundColor: '#f4f6f8' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#cb1c22', // Đỏ đặc trưng FPT
        paddingHorizontal: 10,
        paddingVertical: 12,
        paddingTop: 12,
    },
    backBtn: { padding: 5 },
    menuBtn: { padding: 5 },
    headerTitleContainer: { alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    onlineIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4cd964', marginRight: 5 },
    onlineText: { fontSize: 12, color: '#f0f0f0' },

    // Chat List
    chatList: { padding: 15, paddingBottom: 20 },
    messageRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end' },
    messageRowUser: { justifyContent: 'flex-end' },
    messageRowAI: { justifyContent: 'flex-start' },

    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ffe8e8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#fce3e3'
    },

    bubble: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        maxWidth: '75%',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    userBubble: {
        backgroundColor: '#cb1c22',
        borderBottomRightRadius: 4, // Vuông góc ở đuôi chat
    },
    aiBubble: {
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 4, // Vuông góc ở đuôi chat
        borderWidth: 1,
        borderColor: '#eee'
    },

    text: { fontSize: 15, lineHeight: 22 },
    userText: { color: '#ffffff' },
    aiText: { color: '#333333' },

    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginTop: 8,
        marginBottom: 8,
    },
    linkButton: {
        backgroundColor: '#cb1c22',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginTop: 8,
        marginBottom: 4,
        alignItems: 'center',
    },
    linkButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // Trạng thái trống
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { color: '#888', marginTop: 15, fontSize: 14, fontStyle: 'italic' },

    // Loading typing
    loadingContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 15, marginBottom: 15 },
    aiAvatarSmall: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ffe8e8', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    typingBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, borderWidth: 1, borderColor: '#eee' },
    typingText: { marginLeft: 8, fontSize: 13, color: '#cb1c22', fontStyle: 'italic' },

    // Input Area
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 25 : 12,
        backgroundColor: '#fff',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingTop: 12,
        paddingBottom: 12,
        minHeight: 45,
        maxHeight: 100,
        fontSize: 15,
        color: '#333'
    },
    sendButton: {
        marginLeft: 12,
        backgroundColor: '#cb1c22',
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#cb1c22',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0
    }
});

export default ChatAIScreen;