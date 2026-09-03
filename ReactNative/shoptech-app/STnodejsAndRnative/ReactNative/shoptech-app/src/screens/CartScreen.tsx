import React, { useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
    ActivityIndicator, Alert, StatusBar, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '../store/cartStore';
import { useFlashSaleStore } from '../store/flashSaleStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function CartScreen() {
    const { items: rawItems, isLoading, fetchCart, removeFromCart, updateQuantity } = useCartStore();
    const { currentSale } = useFlashSaleStore();
    const navigation = useNavigation<any>();

    const items = React.useMemo(() => {
        return rawItems.map(item => {
            let displayPrice = item.price;
            let originalPrice = item.originalPrice; // fallback if set by store
            if (currentSale && currentSale.items) {
                const fsItem = currentSale.items.find((fs: any) => 
                    fs.variant?._id === item.id || fs.variant === item.id ||
                    fs.variant?._id === item.productId || fs.variant === item.productId
                );
                if (fsItem) {
                    originalPrice = item.originalPrice || item.price;
                    displayPrice = fsItem.salePrice;
                }
            }
            return { ...item, price: displayPrice, originalPrice };
        });
    }, [rawItems, currentSale]);

    const getTotalPrice = () => items.reduce((total, item) => total + item.price * item.quantity, 0);

    useEffect(() => {
        fetchCart();
    }, []);

    // Trạng thái đang tải
    if (isLoading && items.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Giỏ hàng</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#cb1c22" />
                </View>
            </SafeAreaView>
        );
    }

    // Trạng thái giỏ hàng trống
    if (items.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Giỏ hàng</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <Image
                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11329/11329060.png' }}
                        style={{ width: 120, height: 120, marginBottom: 20, opacity: 0.5 }}
                    />
                    <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống</Text>
                    <Text style={styles.emptySubText}>Hãy chọn thêm sản phẩm để mua sắm nhé!</Text>
                    <TouchableOpacity style={styles.continueShoppingBtn} onPress={() => navigation.navigate('HomeTab')}>
                        <Text style={styles.continueShoppingText}>TIẾP TỤC MUA SẮM</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />

            {/* HEADER - Phong cách FPT Shop */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Giỏ hàng ({items.length})</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.container}>
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={styles.cartItem}>
                            <Image source={{ uri: item.image }} style={styles.itemImage} />

                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                                <View style={styles.priceContainer}>
                                    <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')} ₫</Text>
                                    {item.originalPrice && (
                                        <Text style={styles.originalPrice}>{item.originalPrice.toLocaleString('vi-VN')} ₫</Text>
                                    )}
                                </View>

                                <View style={styles.actionRow}>
                                    <View style={styles.quantityContainer}>
                                        <TouchableOpacity
                                            style={styles.qtyBtn}
                                            onPress={() => updateQuantity(item.id, -1)}
                                        >
                                            <Ionicons name="remove" size={20} color="#555" />
                                        </TouchableOpacity>

                                        <Text style={styles.quantityText}>{item.quantity}</Text>

                                        <TouchableOpacity
                                            style={[styles.qtyBtn, item.quantity >= item.stock && styles.qtyBtnDisabled]}
                                            onPress={() => {
                                                if (item.quantity >= item.stock) {
                                                    Alert.alert('Thông báo', `Sản phẩm này chỉ còn tối đa ${item.stock} trong kho.`);
                                                } else {
                                                    updateQuantity(item.id, 1);
                                                }
                                            }}
                                        >
                                            <Ionicons name="add" size={20} color={item.quantity >= item.stock ? "#ccc" : "#555"} />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity style={styles.deleteBtn} onPress={() => removeFromCart(item.id)}>
                                        <MaterialCommunityIcons name="trash-can-outline" size={22} color="#999" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                />

                {/* FOOTER THANH TOÁN */}
                <View style={styles.footer}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Tạm tính:</Text>
                        <Text style={styles.totalPrice}>{getTotalPrice().toLocaleString('vi-VN')} ₫</Text>
                    </View>
                    <TouchableOpacity style={styles.checkoutButton} onPress={() => navigation.navigate('Checkout')}>
                        <Text style={styles.checkoutText}>TIẾN HÀNH ĐẶT HÀNG</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#cb1c22'
    },
    container: {
        flex: 1,
        backgroundColor: '#f4f6f8'
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f4f6f8'
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#cb1c22',
        paddingHorizontal: 10,
        paddingBottom: 12,
        paddingTop: 10,
    },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f4f6f8',
        paddingHorizontal: 20
    },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 10 },
    emptySubText: { fontSize: 14, color: '#666', marginTop: 8, marginBottom: 25, textAlign: 'center' },
    continueShoppingBtn: {
        backgroundColor: '#cb1c22',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    continueShoppingText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    // Cart List
    listContent: { padding: 12, paddingBottom: 20 },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginBottom: 12,
        padding: 12,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    itemImage: { width: 90, height: 90, borderRadius: 6, resizeMode: 'contain', backgroundColor: '#f9f9f9' },
    itemDetails: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
    itemName: { fontSize: 14, fontWeight: '500', color: '#333', lineHeight: 20 },
    priceContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#cb1c22', marginRight: 6 },
    originalPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' },

    // Actions (Quantity & Delete)
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 4,
    },
    qtyBtn: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9'
    },
    qtyBtnDisabled: { backgroundColor: '#f0f0f0' },
    quantityText: {
        width: 35,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#e0e0e0',
        paddingVertical: 5
    },
    deleteBtn: { padding: 5 },

    // Footer Checkout
    footer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 25, // Tạo khoảng trống an toàn cho các dòng điện thoại không có nút home vật lý
        borderTopWidth: 1,
        borderTopColor: '#eee',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    totalLabel: { fontSize: 15, color: '#333', fontWeight: '500' },
    totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#cb1c22' },
    checkoutButton: {
        backgroundColor: '#cb1c22',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    checkoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});