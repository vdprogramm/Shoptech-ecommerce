import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axiosClient from '../api/axiosClient';
import ProductCard from '../components/ProductCard';

export default function StoreDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { store } = route.params;

    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStoreProducts = async () => {
            try {
                // Fetch products by store ID using query param
                const res: any = await axiosClient.get(`/products?store=${store._id}`);
                setProducts(res.data || res || []);
            } catch (error) {
                console.log('Lỗi lấy sản phẩm của cửa hàng:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (store?._id) {
            fetchStoreProducts();
        }
    }, [store._id]);

    const renderHeader = () => (
        <View style={styles.storeHeader}>
            <View style={styles.logoWrapper}>
                {store.logoUrl ? (
                    <Image source={{ uri: store.logoUrl }} style={styles.logo} />
                ) : (
                    <View style={styles.logoPlaceholder}>
                        <MaterialCommunityIcons name="storefront-outline" size={40} color="#ff4757" />
                    </View>
                )}
            </View>
            <View style={styles.storeInfo}>
                <Text style={styles.storeName} numberOfLines={2}>{store.name}</Text>
                {store.address ? (
                    <View style={styles.rowInfo}>
                        <Ionicons name="location-outline" size={14} color="#fff" />
                        <Text style={styles.storeAddress} numberOfLines={2}>{store.address}</Text>
                    </View>
                ) : null}
                <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeBadgeText}>Đang hoạt động</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header Navigation */}
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={26} color="#333" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Chi tiết cửa hàng</Text>
                <View style={{ width: 34 }} />
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#ff4757" />
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item._id}
                    ListHeaderComponent={
                        <>
                            {renderHeader()}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Sản phẩm của Shop ({products.length})</Text>
                            </View>
                        </>
                    }
                    renderItem={({ item }) => (
                        <ProductCard 
                            product={item} 
                            onPress={() => navigation.push('ProductDetail', { product: item })} 
                        />
                    )}
                    numColumns={2}
                    contentContainerStyle={styles.listContainer}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="package-variant-closed" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>Cửa hàng này chưa có sản phẩm nào.</Text>
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
        backgroundColor: '#f8f9fa',
    },
    navHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        elevation: 2,
    },
    backBtn: {
        padding: 4,
    },
    navTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    storeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ff4757',
        padding: 20,
        margin: 15,
        borderRadius: 15,
        elevation: 5,
        shadowColor: '#ff4757',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    logoWrapper: {
        marginRight: 15,
        backgroundColor: '#fff',
        borderRadius: 40,
        padding: 2,
    },
    logo: {
        width: 70,
        height: 70,
        borderRadius: 35,
        resizeMode: 'cover',
    },
    logoPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#ffeef0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    storeInfo: {
        flex: 1,
    },
    storeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    rowInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    storeAddress: {
        fontSize: 13,
        color: '#fff',
        flex: 1,
        opacity: 0.9,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4ade80',
    },
    activeBadgeText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '600',
    },
    sectionHeader: {
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    listContainer: {
        paddingBottom: 30,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        marginTop: 10,
        color: '#999',
        fontSize: 15,
    },
});
