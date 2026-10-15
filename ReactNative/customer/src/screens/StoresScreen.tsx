import React, { useCallback, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    TextInput, Image, ActivityIndicator, RefreshControl,
    Linking
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useStoreStore, Store } from '../store/storeStore';

export default function StoresScreen() {
    const navigation = useNavigation<any>();
    const { stores, isLoading, fetchAllStores } = useStoreStore();
    const [searchText, setSearchText] = useState('');

    useFocusEffect(
        useCallback(() => {
            fetchAllStores();
        }, [])
    );

    const filteredStores = stores.filter(
        (s) =>
            s.isActive &&
            (s.name.toLowerCase().includes(searchText.toLowerCase()) ||
                s.address?.toLowerCase().includes(searchText.toLowerCase()))
    );

    const handleCall = (phone?: string) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const renderItem = ({ item }: { item: Store }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('StoreDetail', { store: item })}
            activeOpacity={0.85}
        >
            {/* Logo cửa hàng */}
            <View style={styles.logoWrapper}>
                {item.logoUrl ? (
                    <Image source={{ uri: item.logoUrl }} style={styles.logo} />
                ) : (
                    <View style={styles.logoPlaceholder}>
                        <MaterialCommunityIcons name="storefront-outline" size={30} color="#d70018" />
                    </View>
                )}
            </View>

            {/* Thông tin cửa hàng */}
            <View style={styles.info}>
                <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>

                {item.address ? (
                    <View style={styles.rowInfo}>
                        <Ionicons name="location-outline" size={13} color="#999" />
                        <Text style={styles.storeAddress} numberOfLines={1}>{item.address}</Text>
                    </View>
                ) : null}

                {item.phone ? (
                    <View style={styles.rowInfo}>
                        <Ionicons name="call-outline" size={13} color="#999" />
                        <Text style={styles.storePhone}>{item.phone}</Text>
                    </View>
                ) : null}

                {/* Badge trạng thái */}
                <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeBadgeText}>Đang hoạt động</Text>
                </View>
            </View>

            {/* Nút gọi điện nhanh */}
            {item.phone ? (
                <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCall(item.phone)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="call" size={18} color="#fff" />
                </TouchableOpacity>
            ) : (
                <Ionicons name="chevron-forward" size={18} color="#ccc" style={{ marginLeft: 8 }} />
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
                <Text style={styles.headerTitle}>Cửa hàng</Text>
                <View style={{ width: 34 }} />
            </View>

            {/* Thanh tìm kiếm */}
            <View style={styles.searchWrapper}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm theo tên hoặc địa chỉ..."
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

            {/* Số kết quả */}
            <View style={styles.countRow}>
                <Text style={styles.countText}>{filteredStores.length} cửa hàng</Text>
            </View>

            {/* Danh sách */}
            {isLoading && stores.length === 0 ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#d70018" />
                </View>
            ) : (
                <FlatList
                    data={filteredStores}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={fetchAllStores}
                            colors={['#d70018']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="store-off-outline" size={80} color="#ddd" />
                            <Text style={styles.emptyTitle}>
                                {searchText ? 'Không tìm thấy kết quả' : 'Chưa có cửa hàng nào'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {searchText
                                    ? 'Thử tìm với từ khóa khác'
                                    : 'Danh sách cửa hàng sẽ xuất hiện tại đây'}
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
    searchWrapper: {
        paddingHorizontal: 15,
        paddingVertical: 12,
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
    countRow: {
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    countText: {
        fontSize: 13,
        color: '#888',
        fontWeight: '500',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 20,
        flexGrow: 1,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginVertical: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
    },
    logoWrapper: {
        marginRight: 14,
    },
    logo: {
        width: 58,
        height: 58,
        borderRadius: 12,
        resizeMode: 'cover',
    },
    logoPlaceholder: {
        width: 58,
        height: 58,
        borderRadius: 12,
        backgroundColor: '#ffeef0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    storeName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    rowInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    storeAddress: {
        fontSize: 12,
        color: '#888',
        flex: 1,
    },
    storePhone: {
        fontSize: 12,
        color: '#888',
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    activeDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#22c55e',
    },
    activeBadgeText: {
        fontSize: 11,
        color: '#22c55e',
        fontWeight: '600',
    },
    callBtn: {
        backgroundColor: '#d70018',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        flexShrink: 0,
    },
    separator: {
        height: 4,
    },
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
