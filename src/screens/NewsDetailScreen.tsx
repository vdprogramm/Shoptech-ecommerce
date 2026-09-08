import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image,
    TouchableOpacity, Share, Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { News } from '../store/newsStore';

const { width } = Dimensions.get('window');
const BASE_URL = 'http://10.0.2.2:3001';

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

export default function NewsDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const news: News = route.params?.news;

    if (!news) {
        navigation.goBack();
        return null;
    }

    const getImageUri = (url?: string) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url}`;
    };

    const handleShare = async () => {
        try {
            await Share.share({
                title: news.title,
                message: `${news.title}\n\n${news.excerpt}`,
            });
        } catch {
            // ignore
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Ảnh bìa */}
                {getImageUri(news.imageUrl) ? (
                    <Image
                        source={{ uri: getImageUri(news.imageUrl)! }}
                        style={styles.coverImage}
                    />
                ) : (
                    <View style={[styles.coverImage, styles.coverPlaceholder]}>
                        <Ionicons name="newspaper-outline" size={60} color="#ddd" />
                    </View>
                )}

                {/* Nút back & share nổi trên ảnh */}
                <View style={styles.floatingBar}>
                    <TouchableOpacity style={styles.floatBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={22} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.floatBtn} onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={22} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Nội dung bài viết */}
                <View style={styles.contentWrapper}>
                    {/* Badge + Ngày */}
                    <View style={styles.metaRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>TIN TỨC</Text>
                        </View>
                        <View style={styles.dateRow}>
                            <Ionicons name="time-outline" size={13} color="#aaa" />
                            <Text style={styles.dateText}>{formatDate(news.createdAt)}</Text>
                        </View>
                    </View>

                    {/* Tiêu đề */}
                    <Text style={styles.title}>{news.title}</Text>

                    {/* Tóm tắt */}
                    <View style={styles.excerptBox}>
                        <View style={styles.excerptLine} />
                        <Text style={styles.excerpt}>{news.excerpt}</Text>
                    </View>

                    {/* Separator */}
                    <View style={styles.divider} />

                    {/* Nội dung chính */}
                    <Text style={styles.content}>{news.content}</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    coverImage: {
        width: '100%',
        height: 260,
        resizeMode: 'cover',
    },
    coverPlaceholder: {
        backgroundColor: '#f2f2f2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingBar: {
        position: 'absolute',
        top: 48,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },
    floatBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
    },
    contentWrapper: {
        padding: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    badge: {
        backgroundColor: '#ffeef0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        color: '#d70018',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 12,
        color: '#aaa',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111',
        lineHeight: 30,
        marginBottom: 16,
    },
    excerptBox: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    excerptLine: {
        width: 3,
        backgroundColor: '#d70018',
        borderRadius: 2,
    },
    excerpt: {
        flex: 1,
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginBottom: 16,
    },
    content: {
        fontSize: 15,
        color: '#333',
        lineHeight: 26,
    },
});
