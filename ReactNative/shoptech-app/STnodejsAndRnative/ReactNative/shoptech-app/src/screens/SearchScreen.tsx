import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    StatusBar,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useProductStore } from '../store/productStore';
import ProductCard from '../components/ProductCard';
import { useNavigation } from '@react-navigation/native';

export default function SearchScreen() {
    const { products, fetchProducts, isLoadingProducts } = useProductStore();
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;
    const navigation = useNavigation<any>();

    useEffect(() => {
        if (products.length === 0) {
            fetchProducts();
        }
    }, []);

    // Reset trang khi thay đổi từ khóa tìm kiếm
    useEffect(() => {
        setPage(1);
    }, [searchText]);

    const filteredProducts = products.filter(item =>
        item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.category?.name?.toLowerCase().includes(searchText.toLowerCase())
    );

    const displayProducts = filteredProducts.slice(0, page * PAGE_SIZE);

    const handleLoadMore = () => {
        if (displayProducts.length < filteredProducts.length) {
            setPage(prevPage => prevPage + 1);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.cardContainer}>
            <ProductCard
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />

            {/* SEARCH HEADER - Phong cách FPT Shop */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>

                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#888" />
                    <TextInput
                        placeholder="Bạn tìm gì hôm nay?"
                        placeholderTextColor="#999"
                        style={styles.searchInput}
                        value={searchText}
                        onChangeText={setSearchText}
                        autoFocus={true} // Tự động bật bàn phím khi vào trang tìm kiếm
                        returnKeyType="search"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearBtn}>
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.container}>
                {/* RESULTS */}
                {isLoadingProducts ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#cb1c22" />
                        <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={displayProducts}
                        renderItem={renderItem}
                        keyExtractor={(item) => item._id}
                        numColumns={2}
                        contentContainerStyle={styles.listContent}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            displayProducts.length < filteredProducts.length ? (
                                <View style={{ paddingVertical: 20 }}>
                                    <ActivityIndicator size="small" color="#cb1c22" />
                                </View>
                            ) : null
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name="shopping-search" size={70} color="#e0e0e0" />
                                <Text style={styles.emptyText}>
                                    {searchText ? `Rất tiếc, không tìm thấy sản phẩm nào phù hợp với "${searchText}"` : 'Nhập tên điện thoại, laptop... cần tìm'}
                                </Text>
                            </View>
                        }
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#cb1c22', // Đỏ đặc trưng FPT Shop
    },
    container: {
        flex: 1,
        backgroundColor: '#f4f6f8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingBottom: 12,
        paddingTop: 10,
        backgroundColor: '#cb1c22',
    },
    backBtn: {
        paddingRight: 10,
        justifyContent: 'center',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        height: 42,
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: '#333',
        height: '100%',
    },
    clearBtn: {
        padding: 4,
    },
    listContent: {
        paddingHorizontal: 8,
        paddingTop: 12,
        paddingBottom: 20,
    },
    cardContainer: {
        flex: 0.5,
        padding: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        marginTop: 120,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
    },
});