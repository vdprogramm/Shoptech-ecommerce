import React, { useCallback, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    TextInput, Image, ActivityIndicator, RefreshControl, Dimensions
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNewsStore, News } from '../store/newsStore';

const { width } = Dimensions.get('window');
const BASE_URL = 'http://10.0.2.2:3001';

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export default function NewsScreen() {
    const navigation = useNavigation<any>();
    const { newsList, isLoading, fetchAllNews, setSelectedNews } = useNewsStore();
    const [searchText, setSearchText] = useState('');

    useFocusEffect(
        useCallback(() => {
            fetchAllNews();
        }, [])
    );

    const filteredNews = newsList.filter((n) =>
        n.title.toLowerCase().includes(searchText.toLowerCase()) ||
        n.excerpt.toLowerCase().includes(searchText.toLowerCase())
    );

    const handlePress = (item: News) => {
        setSelectedNews(item);
        navigation.navigate('NewsDetail', { news: item });
    };

    // Bài viết đầu tiên — hiển thị nổi bật (Hero card)
    const hero = filteredNews[0];
    const restNews = filteredNews.slice(1);

    const getImageUri = (url?: string) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url}`; // ảnh lưu trên server local
    };

    const renderSmallCard = ({ item }: { item: News }) => (
        <TouchableOpacity style={styles.smallCard} onPress={() => handlePress(item)} activeOpacity={0.85}>
            {/* Ảnh thumbnail */}
            <View style={styles.smallImageWrapper}>
                {getImageUri(item.imageUrl) ? (
                    <Image
                        source={{ uri: getImageUri(item.imageUrl)! }}
                        style={styles.smallImage}
                    />
                ) : (
                    <View style={styles.smallImagePlaceholder}>
                        <Ionicons name="newspaper-outline" size={24} color="#ccc" />
                    </View>
                )}
            </View>

            {/* Nội dung */}
            <View style={styles.smallContent}>
                <Text style={styles.smallTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.smallExcerpt} numberOfLines={2}>{item.excerpt}</Text>
                <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={12} color="#aaa" />
                    <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={26} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tin tức & Sự kiện</Text>
                <View style={{ width: 34 }} />
            </View>

            {/* Thanh tìm kiếm */}
            <View style={styles.searchWrapper}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={17} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm bài viết..."
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons name="close-circle" size={16} color="#ccc" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {isLoading && newsList.length === 0 ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#d70018" />
                </View>
            ) : filteredNews.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="newspaper-outline" size={80} color="#ddd" />
                    <Text style={styles.emptyTitle}>
                        {searchText ? 'Không tìm thấy bài viết' : 'Chưa có tin tức nào'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {searchText ? 'Thử tìm với từ khóa khác' : 'Hãy quay lại sau nhé!'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={restNews}
                    keyExtractor={(item) => item._id}
                    renderItem={renderSmallCard}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={fetchAllNews}
                            colors={['#d70018']}
                        />
                    }
                    ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f0f0f0' }} />}
                    /* Bài viết đầu tiên hiển thị to kiểu Hero */
                    ListHeaderComponent={
                        hero && !searchText ? (
                            <TouchableOpacity
                                style={styles.heroCard}
                                onPress={() => handlePress(hero)}
                                activeOpacity={0.9}
                            >
                                {getImageUri(hero.imageUrl) ? (
                                    <Image
                                        source={{ uri: getImageUri(hero.imageUrl)! }}
                                        style={styles.heroImage}
                                    />
                                ) : (
                                    <View style={[styles.heroImage, styles.heroPlaceholder]}>
                                        <Ionicons name="newspaper-outline" size={50} color="#ddd" />
                                    </View>
                                )}
                                <View style={styles.heroOverlay}>
                                    <View style={styles.newsBadge}>
                                        <Text style={styles.newsBadgeText}>MỚI NHẤT</Text>
                                    </View>
                                    <Text style={styles.heroTitle} numberOfLines={2}>{hero.title}</Text>
                                    <Text style={styles.heroExcerpt} numberOfLines={2}>{hero.excerpt}</Text>
                                    <View style={styles.metaRow}>
                                        <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
                                        <Text style={[styles.metaText, { color: 'rgba(255,255,255,0.8)' }]}>
                                            {formatDate(hero.createdAt)}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ) : null
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
    backBtn: { padding: 4 },
    headerTitle: {
        color: '#fff',
        fontSize: 19,
        fontWeight: 'bold',
    },
    searchWrapper: {
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingBottom: 30,
        flexGrow: 1,
        backgroundColor: '#fff',
    },

    // Hero card (bài viết nổi bật đầu tiên)
    heroCard: {
        width: '100%',
        height: 240,
        position: 'relative',
        marginBottom: 4,
    },
    heroImage: {
        width: '100%',
        height: 240,
        resizeMode: 'cover',
    },
    heroPlaceholder: {
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
        paddingTop: 30,
        // gradient-like dark overlay
        backgroundColor: 'rgba(0,0,0,0.52)',
    },
    newsBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#d70018',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        marginBottom: 6,
    },
    newsBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    heroTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        lineHeight: 23,
        marginBottom: 4,
    },
    heroExcerpt: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12,
        lineHeight: 17,
        marginBottom: 6,
    },

    // Small cards
    smallCard: {
        flexDirection: 'row',
        padding: 14,
        backgroundColor: '#fff',
    },
    smallImageWrapper: {
        marginRight: 12,
        flexShrink: 0,
    },
    smallImage: {
        width: 88,
        height: 72,
        borderRadius: 10,
        resizeMode: 'cover',
    },
    smallImagePlaceholder: {
        width: 88,
        height: 72,
        borderRadius: 10,
        backgroundColor: '#f2f2f2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    smallContent: {
        flex: 1,
        justifyContent: 'center',
    },
    smallTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a1a1a',
        lineHeight: 20,
        marginBottom: 4,
    },
    smallExcerpt: {
        fontSize: 12,
        color: '#777',
        lineHeight: 17,
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: '#aaa',
    },

    // Empty state
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
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
