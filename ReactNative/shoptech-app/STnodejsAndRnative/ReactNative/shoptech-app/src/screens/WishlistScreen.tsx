import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useWishlistStore } from '../store/wishlistStore';
import ProductCard from '../components/ProductCard';
import { Ionicons } from '@expo/vector-icons';

export default function WishlistScreen() {
    const navigation = useNavigation<any>();
    const { wishlist, isLoading, fetchWishlist } = useWishlistStore();

    // Tự động tải lại danh sách yêu thích mỗi khi người dùng mở màn hình này
    useFocusEffect(
        useCallback(() => {
            fetchWishlist();
        }, [])
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />
            {/* Header của trang Wishlist */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sản phẩm yêu thích</Text>
            </View>

            {isLoading && wishlist.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#ff4757" />
                </View>
            ) : (
                <FlatList
                    data={wishlist}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        // Tránh lỗi khi product chưa được populate hoặc null
                        if (!item.product || typeof item.product !== 'object') {
                            return null;
                        }
                        return (
                            <ProductCard
                                product={item.product}
                                onPress={() => navigation.navigate('ProductDetail', { product: item.product })}
                            />
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="heart-dislike-outline" size={80} color="#ccc" />
                            <Text style={styles.emptyText}>Danh sách yêu thích trống</Text>
                            <TouchableOpacity
                                style={styles.shopButton}
                                onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
                            >
                                <Text style={styles.shopButtonText}>Mua sắm ngay</Text>
                            </TouchableOpacity>
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
    header: {
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#cb1c22',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 15,
        bottom: 15,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 10,
        paddingBottom: 20,
    },
    row: {
        justifyContent: 'space-between',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
        marginTop: 15,
        marginBottom: 20,
    },
    shopButton: {
        backgroundColor: '#cb1c22',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    shopButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
