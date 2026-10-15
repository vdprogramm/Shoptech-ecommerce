import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView, TextInput, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useWarrantyStore, Warranty } from '../store/warrantyStore';

export default function WarrantyLookupScreen() {
    const navigation = useNavigation();
    const { myWarranties, isLoading, fetchMyWarranties } = useWarrantyStore();
    const [searchQuery, setSearchQuery] = useState('');

    useFocusEffect(
        useCallback(() => {
            fetchMyWarranties();
        }, [])
    );

    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    const filteredWarranties = myWarranties.filter((w) => {
        const productName = w.product?.name || '';
        const orderCode = w.order?.orderCode || '';
        const query = searchQuery.toLowerCase();
        return productName.toLowerCase().includes(query) || orderCode.toLowerCase().includes(query);
    });

    const paginatedWarranties = filteredWarranties.slice(0, page * ITEMS_PER_PAGE);

    const handleLoadMore = () => {
        if (page * ITEMS_PER_PAGE < filteredWarranties.length) {
            setPage(prev => prev + 1);
        }
    };

    const renderItem = ({ item }: { item: Warranty }) => {
        const endDate = new Date(item.endDate);
        const startDate = new Date(item.startDate);
        const isActive = endDate.getTime() > Date.now();
        const statusColor = isActive ? '#2e7d32' : '#d32f2f';
        const statusText = isActive ? 'Đang bảo hành' : 'Hết bảo hành';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.statusBadge}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                    </View>
                    {item.order?.orderCode && (
                        <Text style={styles.orderCode}>Đơn: {item.order.orderCode}</Text>
                    )}
                </View>

                <View style={styles.productInfo}>
                    {item.product?.images?.[0] ? (
                        <Image source={{ uri: item.product.images[0] }} style={styles.productImage} />
                    ) : (
                        <MaterialCommunityIcons name="cellphone" size={32} color="#555" style={styles.productIcon} />
                    )}
                    <View style={styles.productDetails}>
                        <Text style={styles.productName} numberOfLines={2}>{item.product?.name || 'Sản phẩm không xác định'}</Text>
                    </View>
                </View>

                <View style={styles.dateRow}>
                    <View style={styles.dateItem}>
                        <Text style={styles.dateLabel}>Ngày bắt đầu</Text>
                        <Text style={styles.dateValue}>{startDate.toLocaleDateString('vi-VN')}</Text>
                    </View>
                    <View style={styles.dateDivider} />
                    <View style={styles.dateItem}>
                        <Text style={styles.dateLabel}>Ngày kết thúc</Text>
                        <Text style={[styles.dateValue, { color: statusColor }]}>{endDate.toLocaleDateString('vi-VN')}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bảo hành của tôi</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm theo tên sản phẩm, mã đơn..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#d70018" />
                </View>
            ) : (
                <FlatList
                    data={paginatedWarranties}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        page * ITEMS_PER_PAGE < filteredWarranties.length ? (
                            <ActivityIndicator size="small" color="#d70018" style={{ padding: 10 }} />
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="shield-checkmark-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Bạn chưa có thẻ bảo hành nào'}
                            </Text>
                        </View>
                    }
                />
            )}
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
        backgroundColor: '#cb1c22',
    },
    backButton: { padding: 5, marginRight: 10 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    searchContainer: {
        padding: 15,
        backgroundColor: '#fff',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f3f5',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 15 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    orderCode: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    productInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f5',
    },
    productIcon: {
        backgroundColor: '#f1f3f5',
        padding: 10,
        borderRadius: 8,
        marginRight: 12,
    },
    productImage: {
        width: 52,
        height: 52,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#f1f3f5',
        resizeMode: 'contain',
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        lineHeight: 20,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateItem: {
        flex: 1,
    },
    dateDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#f1f3f5',
        marginHorizontal: 15,
    },
    dateLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 14,
        color: '#666',
    }
});
