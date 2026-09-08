import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator, Dimensions, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCartStore } from '../store/cartStore';
import { useFlashSaleStore } from '../store/flashSaleStore';
import axiosClient from '../api/axiosClient';
import SuccessModal from '../components/SuccessModal';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();

    const { product: initialProduct, productId } = route.params || {};
    const { addToCart, items: cartItems } = useCartStore();
    const { currentSale } = useFlashSaleStore();

    const [product, setProduct] = useState<any>(initialProduct);
    const [isLoadingProduct, setIsLoadingProduct] = useState(!initialProduct && !!productId);
    const [showCartSuccess, setShowCartSuccess] = useState(false);

    useEffect(() => {
        if (!initialProduct && productId) {
            const fetchProduct = async () => {
                try {
                    const res: any = await axiosClient.get(`/products/${productId}`);
                    setProduct(res.data ?? res);
                } catch (error) {
                    console.log('Lỗi fetch product', error);
                } finally {
                    setIsLoadingProduct(false);
                }
            };
            fetchProduct();
        }
    }, [initialProduct, productId]);

    const variants = product?.variants || [];
    const [selectedVariant, setSelectedVariant] = useState(variants.length > 0 ? variants[0] : null);

    let displayPrice = selectedVariant ? selectedVariant.price : product?.price;
    let originalPrice = null;

    if (currentSale && currentSale.items) {
        const targetVariantId = selectedVariant?._id || (product?.variants?.length > 0 ? (product.variants[0]._id || product.variants[0]) : product?._id);
        const flashSaleItem = currentSale.items.find((item: any) => 
            item.variant?._id === targetVariantId || 
            item.variant === targetVariantId ||
            item.variant?._id === product?._id ||
            item.variant === product?._id
        );
        
        if (flashSaleItem) {
            originalPrice = displayPrice;
            displayPrice = flashSaleItem.salePrice;
        }
    }

    const displayStock = selectedVariant ? selectedVariant.stock : product?.stock;

    const [isLiked, setIsLiked] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);
    const [attributes, setAttributes] = useState<any[]>([]);
    const [isLoadingAttributes, setIsLoadingAttributes] = useState(true);
    const [storeProfile, setStoreProfile] = useState<any>(null);

    useEffect(() => {
        const checkLikedStatus = async () => {
            try {
                const res: any = await axiosClient.get(`/wishlists/check/${product?._id}`);
                setIsLiked(res.data?.isLiked ?? res.isLiked);
            } catch (error) {
                console.log('Lỗi check wishlist:', error);
            }
        };
        const fetchReviews = async () => {
            try {
                const res: any = await axiosClient.get(`/reviews/product/${product?._id}`);
                setReviews(res.data ?? res);
            } catch (error) {
                console.log('Lỗi lấy đánh giá:', error);
            } finally {
                setIsLoadingReviews(false);
            }
        };

        const fetchAttributes = async () => {
            try {
                const res: any = await axiosClient.get(`/product-attributes/product/${product?._id}`);
                setAttributes(res.data ?? res);
            } catch (error) {
                console.log('Lỗi lấy thông số kỹ thuật:', error);
            } finally {
                setIsLoadingAttributes(false);
            }
        };

        const fetchStoreProfile = async () => {
            try {
                if (product?.store && typeof product.store === 'object' && product.store._id) {
                    setStoreProfile(product.store);
                    return;
                }
                const storeId = product?.store;
                if (!storeId) return;

                const res: any = await axiosClient.get(`/stores/${storeId}`);
                setStoreProfile(res.data ?? res);
            } catch (error) {
                console.log('Lỗi lấy thông tin cửa hàng:', error);
            }
        };

        if (product?._id) {
            checkLikedStatus();
            fetchReviews();
            fetchAttributes();
            fetchStoreProfile();
        }
    }, [product?._id]);

    const handleSubmitReview = async () => {
        if (!comment.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập nội dung đánh giá.');
            return;
        }
        try {
            setIsSubmittingReview(true);
            const res: any = await axiosClient.post('/reviews', {
                productId: product?._id,
                rating,
                comment
            });
            Alert.alert('Thành công', 'Đánh giá của bạn đã được gửi!');
            setComment('');
            setRating(5);
            const resReviews: any = await axiosClient.get(`/reviews/product/${product?._id}`);
            setReviews(resReviews.data ?? resReviews);
        } catch (error: any) {
            console.log('Lỗi gửi đánh giá:', error);
            const msg = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.';
            Alert.alert('Lỗi', Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const renderStars = (currentRating: number, onSelect?: (r: number) => void) => {
        return (
            <View style={{ flexDirection: 'row' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => onSelect && onSelect(star)} disabled={!onSelect}>
                        <Ionicons
                            name={star <= currentRating ? "star" : "star-outline"}
                            size={onSelect ? 32 : 16}
                            color="#ffcc00"
                            style={{ marginRight: 5 }}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const handleToggleLike = async () => {
        try {
            const res: any = await axiosClient.post(`/wishlists/${product?._id}/toggle`);
            setIsLiked(res.data?.isLiked ?? res.isLiked);
        } catch (error) {
            console.log('Lỗi toggle wishlist:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật danh sách yêu thích');
        }
    };

    if (isLoadingProduct) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#cb1c22" />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 16, color: '#666' }}>Không tìm thấy thông tin sản phẩm.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, padding: 10, backgroundColor: '#cb1c22', borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const images = product?.images?.length > 0 ? product.images : ['https://via.placeholder.com/400'];

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.heartBtn} onPress={handleToggleLike}>
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#cb1c22" : "#666"} />
            </TouchableOpacity>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View style={styles.imageCarouselContainer}>
                    <FlatList
                        data={images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <Image
                                source={{ uri: item }}
                                style={styles.image}
                            />
                        )}
                    />
                    {images.length > 1 && (
                        <View style={styles.imageIndicatorContainer}>
                            <Text style={styles.imageIndicatorText}>Trượt để xem thêm ảnh ({images.length})</Text>
                        </View>
                    )}
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{product?.name}</Text>
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>{displayPrice?.toLocaleString('vi-VN')} ₫</Text>
                        {originalPrice && (
                            <View style={styles.discountBadgeContainer}>
                                <Text style={styles.originalPriceText}>{originalPrice.toLocaleString('vi-VN')} ₫</Text>
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountBadgeText}>SALE</Text>
                                </View>
                            </View>
                        )}
                    </View>
                    
                    {displayStock > 0 ? (
                        <View style={styles.stockBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                            <Text style={styles.inStock}>Còn hàng ({displayStock})</Text>
                        </View>
                    ) : (
                        <View style={[styles.stockBadge, { backgroundColor: '#ffeef0' }]}>
                            <Ionicons name="close-circle" size={16} color="#cb1c22" />
                            <Text style={styles.outOfStock}>Hết hàng</Text>
                        </View>
                    )}

                    {variants.length > 0 && (
                        <View style={styles.variantSection}>
                            <Text style={styles.descTitle}>Chọn phiên bản:</Text>
                            <View style={styles.variantList}>
                                {variants.map((v: any, index: number) => (
                                    <TouchableOpacity
                                        key={v._id || index}
                                        style={[
                                            styles.variantChip,
                                            selectedVariant?._id === v._id && styles.variantChipSelected
                                        ]}
                                        onPress={() => setSelectedVariant(v)}
                                    >
                                        <Text style={[
                                            styles.variantText,
                                            selectedVariant?._id === v._id && styles.variantTextSelected
                                        ]}>
                                            {v.sku || `Phiên bản ${index + 1}`}
                                        </Text>
                                        <Text style={[
                                            styles.variantPriceText,
                                            selectedVariant?._id === v._id && styles.variantPriceTextSelected
                                        ]}>
                                            {v.price ? `${v.price.toLocaleString('vi-VN')} ₫` : ''}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {storeProfile && (
                        <View style={styles.storeProfileSection}>
                            <TouchableOpacity
                                style={styles.storeProfileCard}
                                onPress={() => navigation.navigate('StoreDetail', { store: storeProfile })}
                                activeOpacity={0.8}
                            >
                                <View style={styles.storeLogoWrapper}>
                                    {storeProfile.logoUrl ? (
                                        <Image source={{ uri: storeProfile.logoUrl }} style={styles.storeLogo} />
                                    ) : (
                                        <View style={styles.storeLogoPlaceholder}>
                                            <MaterialCommunityIcons name="storefront-outline" size={24} color="#cb1c22" />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.storeInfo}>
                                    <Text style={styles.storeNameText} numberOfLines={1}>{storeProfile.name}</Text>
                                    <View style={styles.storeActiveBadge}>
                                        <View style={styles.storeActiveDot} />
                                        <Text style={styles.storeActiveText}>Cửa hàng uy tín</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.viewStoreBtn}
                                    onPress={() => navigation.navigate('StoreDetail', { store: storeProfile })}
                                >
                                    <Text style={styles.viewStoreBtnText}>Xem Shop</Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.attributesSection}>
                        <Text style={styles.descTitle}>Thông số kỹ thuật:</Text>
                        {isLoadingAttributes ? (
                            <ActivityIndicator size="small" color="#cb1c22" style={{ marginBottom: 20 }} />
                        ) : attributes && attributes.length > 0 ? (
                            <View style={styles.attributesTable}>
                                {attributes.map((attr: any, index: number) => (
                                    <View key={attr._id || index} style={[styles.attributeRow, index % 2 === 0 ? styles.attributeRowEven : styles.attributeRowOdd]}>
                                        <Text style={styles.attributeKey}>{attr.key}</Text>
                                        <Text style={styles.attributeValue}>{attr.value}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={{ color: '#666', fontStyle: 'italic', marginBottom: 20 }}>Chưa có thông số kỹ thuật cho sản phẩm này.</Text>
                        )}
                    </View>

                    <Text style={styles.descTitle}>Mô tả sản phẩm:</Text>
                    <Text style={styles.description}>
                        {product?.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
                    </Text>

                    <View style={styles.reviewSection}>
                        <Text style={styles.descTitle}>Đánh giá sản phẩm:</Text>

                        <View style={styles.reviewForm}>
                            <Text style={{ marginBottom: 10, fontSize: 16, fontWeight: '500' }}>Để lại đánh giá của bạn:</Text>
                            {renderStars(rating, setRating)}
                            <TextInput
                                style={styles.reviewInput}
                                placeholder="Nhập nhận xét của bạn..."
                                value={comment}
                                onChangeText={setComment}
                                multiline
                                numberOfLines={3}
                            />
                            <TouchableOpacity
                                style={[styles.submitReviewBtn, isSubmittingReview && { opacity: 0.7 }]}
                                onPress={handleSubmitReview}
                                disabled={isSubmittingReview}
                            >
                                <Text style={styles.submitReviewText}>
                                    {isSubmittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {isLoadingReviews ? (
                            <ActivityIndicator size="small" color="#cb1c22" style={{ marginTop: 20 }} />
                        ) : reviews.length > 0 ? (
                            reviews.map((rev: any, index: number) => (
                                <View key={rev._id || index} style={styles.reviewItem}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={styles.reviewUser}>
                                            {rev.user?.fullName || 'Người dùng ẩn danh'}
                                        </Text>
                                        <Text style={styles.reviewDate}>
                                            {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                                        </Text>
                                    </View>
                                    {renderStars(rev.rating)}
                                    <Text style={styles.reviewComment}>{rev.comment}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: '#666', fontStyle: 'italic', marginTop: 10 }}>Chưa có đánh giá nào cho sản phẩm này.</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.addToCartBtn, displayStock <= 0 && styles.disabledBtn]}
                    onPress={() => {
                        const variantId = selectedVariant?._id || (product?.variants?.length > 0 ? (product.variants[0]._id || product.variants[0]) : product?._id);
                        const currentCartItem = cartItems.find(i => i.id === variantId);
                        const currentQty = currentCartItem ? currentCartItem.quantity : 0;
                        if (currentQty >= displayStock) {
                            Alert.alert('Giới hạn kho hàng', `Kho chỉ còn ${displayStock} sản phẩm.`);
                            return;
                        }
                        addToCart(product, selectedVariant);
                        setShowCartSuccess(true);
                    }}
                    disabled={displayStock <= 0}
                >
                    <Ionicons name="cart-outline" size={24} color={displayStock > 0 ? "#cb1c22" : "#999"} />
                    <Text style={[styles.addToCartText, displayStock <= 0 && { color: "#999" }]}>Thêm vào giỏ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.buyNowBtn, displayStock <= 0 && styles.disabledBtn]}
                    onPress={() => {
                        const variantId = selectedVariant?._id || (product?.variants?.length > 0 ? (product.variants[0]._id || product.variants[0]) : product?._id);
                        const currentCartItem = cartItems.find(i => i.id === variantId);
                        const currentQty = currentCartItem ? currentCartItem.quantity : 0;
                        if (currentQty >= displayStock) {
                            Alert.alert('Giới hạn kho hàng', `Kho chỉ còn ${displayStock} sản phẩm.`);
                            return;
                        }
                        addToCart(product, selectedVariant);
                        navigation.navigate('MainTabs', { screen: 'CartTab' });
                    }}
                    disabled={displayStock <= 0}
                >
                    <Text style={styles.buyNowText}>MUA NGAY</Text>
                    <Text style={styles.buyNowSubText}>Giao tận nơi hoặc nhận tại siêu thị</Text>
                </TouchableOpacity>
            </View>
            <SuccessModal 
                visible={showCartSuccess} 
                title="Thêm thành công!" 
                message={`Đã thêm ${product?.name} vào giỏ hàng`} 
                onClose={() => setShowCartSuccess(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4' },
    backButton: { position: 'absolute', top: 40, left: 15, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: 25 },
    heartBtn: { position: 'absolute', top: 40, right: 15, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.9)', padding: 10, borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    
    imageCarouselContainer: { backgroundColor: '#fff', paddingBottom: 15 },
    image: { width: width, height: 350, resizeMode: 'contain' },
    imageIndicatorContainer: { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15 },
    imageIndicatorText: { color: '#fff', fontSize: 12 },

    infoContainer: { padding: 15, backgroundColor: '#fff', marginTop: 8 },
    name: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 5, lineHeight: 28 },
    priceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
    price: { fontSize: 26, fontWeight: 'bold', color: '#cb1c22', marginRight: 10 },
    discountBadgeContainer: { flexDirection: 'row', alignItems: 'center' },
    originalPriceText: { fontSize: 16, color: '#999', textDecorationLine: 'line-through', marginRight: 8 },
    discountBadge: { backgroundColor: '#cb1c22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    discountBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    
    stockBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 15 },
    inStock: { color: '#16a34a', fontSize: 13, fontWeight: '600', marginLeft: 4 },
    outOfStock: { color: '#cb1c22', fontSize: 13, fontWeight: '600', marginLeft: 4 },

    variantSection: { marginBottom: 20, borderTopWidth: 1, borderColor: '#f1f3f5', paddingTop: 15 },
    variantList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
    variantChip: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, backgroundColor: '#fff', minWidth: '47%' },
    variantChipSelected: { borderColor: '#cb1c22', backgroundColor: '#fff5f5' },
    variantText: { color: '#333', fontSize: 14, textAlign: 'center', fontWeight: '500' },
    variantTextSelected: { color: '#cb1c22', fontWeight: 'bold' },
    variantPriceText: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 4 },
    variantPriceTextSelected: { color: '#cb1c22' },

    storeProfileSection: { marginBottom: 20, paddingTop: 15, borderTopWidth: 1, borderColor: '#f1f3f5' },
    storeProfileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e9ecef' },
    storeLogoWrapper: { marginRight: 12 },
    storeLogo: { width: 50, height: 50, borderRadius: 25, resizeMode: 'cover', borderWidth: 1, borderColor: '#e9ecef' },
    storeLogoPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ffeef0', justifyContent: 'center', alignItems: 'center' },
    storeInfo: { flex: 1 },
    storeNameText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    storeActiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    storeActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
    storeActiveText: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
    viewStoreBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#cb1c22', marginLeft: 10, backgroundColor: '#fff' },
    viewStoreBtnText: { color: '#cb1c22', fontSize: 12, fontWeight: 'bold' },

    descTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    description: { fontSize: 15, color: '#444', lineHeight: 24, textAlign: 'justify' },

    attributesSection: { marginTop: 10, marginBottom: 25, borderTopWidth: 1, borderColor: '#f1f3f5', paddingTop: 15 },
    attributesTable: { borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8, overflow: 'hidden' },
    attributeRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
    attributeRowEven: { backgroundColor: '#f8f9fa' },
    attributeRowOdd: { backgroundColor: '#fff' },
    attributeKey: { flex: 1, fontWeight: '600', color: '#555', fontSize: 13 },
    attributeValue: { flex: 2, color: '#333', fontSize: 13 },

    reviewSection: { marginTop: 25, borderTopWidth: 1, borderColor: '#f1f3f5', paddingTop: 20, marginBottom: 20 },
    reviewForm: { marginBottom: 20, backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#e9ecef' },
    reviewInput: { borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8, padding: 12, marginTop: 15, backgroundColor: '#fff', textAlignVertical: 'top', minHeight: 80, fontSize: 14 },
    submitReviewBtn: { backgroundColor: '#cb1c22', padding: 14, borderRadius: 8, marginTop: 15, alignItems: 'center' },
    submitReviewText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    
    reviewItem: { borderBottomWidth: 1, borderColor: '#f1f3f5', paddingVertical: 15 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    reviewUser: { fontWeight: 'bold', fontSize: 15, color: '#333' },
    reviewDate: { color: '#888', fontSize: 12 },
    reviewComment: { marginTop: 8, fontSize: 14, color: '#444', lineHeight: 22 },

    bottomBar: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e9ecef', paddingBottom: 25 },
    addToCartBtn: { flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#cb1c22', borderRadius: 8, marginRight: 10, paddingVertical: 8, backgroundColor: '#fff' },
    addToCartText: { color: '#cb1c22', fontSize: 12, fontWeight: '600', marginTop: 2 },
    buyNowBtn: { flex: 2.5, backgroundColor: '#cb1c22', borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
    buyNowText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    buyNowSubText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, marginTop: 2 },
    disabledBtn: { opacity: 0.5 },
});