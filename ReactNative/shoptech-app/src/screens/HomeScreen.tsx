import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    ActivityIndicator, TouchableOpacity, Image, Dimensions, StatusBar, Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useProductStore } from '../store/productStore';
import { useBannerStore } from '../store/bannerStore';
import { useFlashSaleStore } from '../store/flashSaleStore';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import ProductCard from '../components/ProductCard';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient'; // Cần cài expo-linear-gradient
import axiosClient from '../api/axiosClient';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { products, categories, isLoadingProducts, fetchProducts, fetchCategoriesAndBrands } = useProductStore();
    const { banners, fetchActiveBanners } = useBannerStore();
    const { currentSale, activeSales, fetchCurrentSale } = useFlashSaleStore();
    const { unreadCount, fetchNotifications } = useNotificationStore();
    const { user } = useAuthStore();

    const [searchText, setSearchText] = useState('');
    const [activeCategoryId, setActiveCategoryId] = useState('ALL');
    const [activeBannerIndex, setActiveBannerIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string } | null>(null);
    const [timeLengths, setTimeLengths] = useState<{ [key: string]: { hours: string; minutes: string; seconds: string } }>({});
    const [points, setPoints] = useState(0);

    // Trạng thái phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
            fetchCategoriesAndBrands();
            fetchActiveBanners();
            fetchCurrentSale();
            fetchNotifications();
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            const fetchPoints = async () => {
                if (user) {
                    try {
                        const response: any = await axiosClient.get('/points/balance');
                        const balance = response.totalPoints ?? response.points ?? response.balance ?? (typeof response === 'number' ? response : 0);
                        setPoints(Number(balance) || 0);
                    } catch (error) {
                        console.log('Error fetching points:', error);
                    }
                }
            };
            fetchPoints();
        }, [user])
    );

    useEffect(() => {
        if (!currentSale || !currentSale.isActive) {
            setTimeLeft(null);
            setTimeLengths({});
            return;
        }

        const updateTimer = () => {
            // Timer cho currentSale
            const difference = new Date(currentSale.endTime).getTime() - Date.now();
            if (difference <= 0) {
                setTimeLeft(null);
            } else {
                const hours = Math.floor(difference / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft({
                    hours: hours.toString().padStart(2, '0'),
                    minutes: minutes.toString().padStart(2, '0'),
                    seconds: seconds.toString().padStart(2, '0'),
                });
            }

            // Timer cho từng activeSales
            if (activeSales && activeSales.length > 0) {
                const newTimeLengths: any = {};
                activeSales.forEach((sale: any) => {
                    const diff = new Date(sale.endTime).getTime() - Date.now();
                    if (diff > 0) {
                        const h = Math.floor(diff / (1000 * 60 * 60));
                        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        const s = Math.floor((diff % (1000 * 60)) / 1000);
                        newTimeLengths[sale._id] = {
                            hours: h.toString().padStart(2, '0'),
                            minutes: m.toString().padStart(2, '0'),
                            seconds: s.toString().padStart(2, '0'),
                        };
                    }
                });
                setTimeLengths(newTimeLengths);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [currentSale, activeSales]);

    const filteredProducts = products.filter((item: any) => {
        const itemCatId = item.category?._id || item.category;
        return activeCategoryId === 'ALL' || itemCatId === activeCategoryId;
    });

    // Reset trang về 1 khi đổi danh mục hoặc danh sách sản phẩm thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategoryId, products]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleScroll = (event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setActiveBannerIndex(index);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
                {/* 1. HEADER & SEARCH BAR */}
                <View style={styles.headerWrapper}>
                    <LinearGradient colors={['#d70018', '#f43f5e']} style={[styles.headerGradient, { paddingTop: Math.max(insets.top, 20) }]}>
                        <View style={styles.searchRow}>
                            <TouchableOpacity
                                style={styles.searchBar}
                                onPress={() => navigation.navigate('SearchTab')}
                            >
                                <Ionicons name="search" size={18} color="#999" />
                                <Text style={styles.searchPlaceholder}>Bạn tìm gì hôm nay?</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Wishlist')}>
                                <Ionicons name="heart-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
                                <View>
                                    <Ionicons name="notifications-outline" size={24} color="#fff" />
                                    {unreadCount > 0 && (
                                        <View style={styles.notifBadge}>
                                            <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* 2. MEMBERSHIP CARD (Dựa theo image_8652f0.jpg) */}
                <View style={styles.membershipContainer}>
                    <LinearGradient colors={['#e11d48', '#fb7185']} style={styles.membershipCard}>
                        <View style={styles.memberHeader}>
                            <View>
                                <Text style={styles.memberGreeting}>Khách hàng</Text>
                                <Text style={styles.memberName}>{user?.fullName || 'Quý Khách'}</Text>
                            </View>
                            <View style={styles.pointsBadge}>
                                <MaterialCommunityIcons name="alpha-f-circle" size={20} color="#ffb800" />
                                <Text style={styles.pointsText}>{points.toLocaleString('vi-VN')}</Text>
                            </View>
                        </View>
                        <View style={styles.quickActions}>
                            {[
                                { icon: 'ticket-percent-outline', label: 'Mã giảm giá', route: 'Vouchers' },
                                { icon: 'truck-fast-outline', label: 'Theo dõi đơn', route: 'MyOrders' },
                                { icon: 'flash', label: 'Flash Sale', route: 'FlashSale' },
                                { icon: 'storefront-outline', label: 'Cửa hàng', route: 'Stores' },
                                { icon: 'newspaper-variant-outline', label: 'Tin tức', route: 'News' },
                            ].map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.actionItem}
                                    onPress={() => {
                                        if (item.route) navigation.navigate(item.route);
                                        else Alert.alert('Thông báo', 'Tính năng đang được phát triển');
                                    }}
                                >
                                    <View style={styles.actionIcon}>
                                        <MaterialCommunityIcons name={item.icon as any} size={24} color="#333" />
                                    </View>
                                    <Text style={styles.actionLabel}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </LinearGradient>
                </View>

                {/* 3. HERO BANNER (Bo góc - image_8643ed.jpg) */}
                <View style={styles.bannerSection}>
                    <ScrollView
                        horizontal pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        {banners.length > 0 ? banners.map((banner: any, index: number) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.9}
                                onPress={() => {
                                    navigation.navigate('Vouchers');
                                }}
                            >
                                <Image
                                    source={{ uri: banner.imageUrl || banner.image }}
                                    style={styles.bannerImage}
                                />
                            </TouchableOpacity>
                        )) : (
                            <Image
                                source={{ uri: 'https://cdn.tgdd.vn/2023/10/banner/Mac-M3-720-220-720x220-4.png' }}
                                style={styles.bannerImage}
                            />
                        )}
                    </ScrollView>
                    <View style={styles.pagination}>
                        {(banners.length > 0 ? banners : [1]).map((_, i) => (
                            <View key={i} style={[styles.dot, activeBannerIndex === i && styles.dotActive]} />
                        ))}
                    </View>
                </View>

                {/* FLASH SALE SECTION (🔥 Săn Deal Giá Sốc) */}
                {activeSales && activeSales.length > 0 && activeSales.map((sale: any, index: number) => {
                    if (!sale.isActive || !sale.items || sale.items.length === 0) return null;
                    const time = timeLengths[sale._id];
                    if (!time) return null;
                    return (
                        <LinearGradient 
                            key={sale._id || index} 
                            colors={['#cb1c22', '#ff4757']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.flashSaleSection}
                        >
                            <View style={styles.flashSaleHeader}>
                                <View style={styles.flashSaleTitleRow}>
                                    <MaterialCommunityIcons name="flash" size={28} color="#ffeb3b" />
                                    <Text style={styles.flashSaleTitle}>{sale.campaignName}</Text>
                                </View>
                                {/* Đồng hồ đếm ngược */}
                                <View style={styles.countdownRow}>
                                    <View style={styles.countdownBox}><Text style={styles.countdownText}>{time.hours}</Text></View>
                                    <Text style={styles.countdownColon}>:</Text>
                                    <View style={styles.countdownBox}><Text style={styles.countdownText}>{time.minutes}</Text></View>
                                    <Text style={styles.countdownColon}>:</Text>
                                    <View style={styles.countdownBox}><Text style={styles.countdownText}>{time.seconds}</Text></View>
                                </View>
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flashSaleList}>
                                {sale.items.map((item: any, idx: number) => {
                                    const variant = item.variant;
                                    const product = variant?.product;
                                    if (!product) return null;

                                    const percentSold = Math.min((item.soldCount / item.quantityLimit) * 100, 100);

                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            style={styles.flashSaleCard}
                                            onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}
                                        >
                                            {/* Tag giảm giá */}
                                            <View style={styles.discountTag}>
                                                <Text style={styles.discountText}>SALE</Text>
                                            </View>

                                            <Image
                                                source={{ uri: product.images?.[0] || 'https://via.placeholder.com/150' }}
                                                style={styles.flashSaleImage}
                                            />
                                            <View style={styles.flashSaleInfo}>
                                                <Text style={styles.flashSaleName} numberOfLines={1}>
                                                    {product.name}
                                                </Text>

                                                {/* Store Profile */}
                                                {product.store && typeof product.store === 'object' && (
                                                    <View style={styles.storeContainer}>
                                                        <Image
                                                            source={{ uri: product.store.logoUrl || 'https://via.placeholder.com/150' }}
                                                            style={styles.storeLogo}
                                                        />
                                                        <Text style={styles.storeName} numberOfLines={1}>
                                                            {product.store.name}
                                                        </Text>
                                                    </View>
                                                )}

                                                <Text style={styles.flashSalePrice}>
                                                    {item.salePrice?.toLocaleString('vi-VN')} đ
                                                </Text>

                                                <Text style={styles.flashSaleOriginalPrice}>
                                                    {variant.price?.toLocaleString('vi-VN')} đ
                                                </Text>

                                                {/* Progress Bar Số lượng đã bán */}
                                                <View style={styles.progressBarBg}>
                                                    <View style={[styles.progressBarFill, { width: `${percentSold}%` }]} />
                                                    <Text style={styles.progressBarLabel}>
                                                        {item.soldCount >= item.quantityLimit ? 'HẾT HÀNG' : `Đã bán ${item.soldCount}`}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </LinearGradient>
                    );
                })}

                {/* 4. SHOP ĐỀ XUẤT (TABS - image_8643ed.jpg) */}
                <View style={styles.recommendSection}>
                    <View style={styles.sectionHeader}>
                        <Image source={{ uri: 'https://fptshop.com.vn/favicon.ico' }} style={styles.miniLogo} />
                        <Text style={styles.sectionTitle}>Shop đề xuất</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
                        <TouchableOpacity
                            style={[styles.tabPill, activeCategoryId === 'ALL' && styles.tabPillActive]}
                            onPress={() => setActiveCategoryId('ALL')}
                        >
                            <Text style={[styles.tabText, activeCategoryId === 'ALL' && styles.tabTextActive]}>Tất cả</Text>
                        </TouchableOpacity>
                        {categories.map((cat: any) => (
                            <TouchableOpacity
                                key={cat._id}
                                style={[styles.tabPill, activeCategoryId === cat._id && styles.tabPillActive]}
                                onPress={() => setActiveCategoryId(cat._id)}
                            >
                                <Text style={[styles.tabText, activeCategoryId === cat._id && styles.tabTextActive]}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* SECTION TIỆN ÍCH TRÊN TRANG CHỦ */}
                    <View style={styles.homeUtilitySection}>
                        <View style={styles.utilityHeader}>
                            <Text style={styles.sectionTitle}>Tiện ích</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('UtilityTab')}>
                                <Text style={styles.seeAllText}>Xem tất cả {'>'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.homeUtilityGrid}>
                            {[
                                { icon: 'newspaper-variant-outline', label: 'Tin tức', color: '#1e88e5', route: 'News' },
                                { icon: 'storefront-outline', label: 'Cửa hàng', color: '#d70018', route: 'Stores' },
                                { icon: 'help-circle-outline', label: 'Trung tâm trợ giúp', color: '#d70018', route: 'HelpCenter' },
                                { icon: 'shield-check-outline', label: 'Tra cứu bảo hành', color: '#333', route: 'WarrantyLookup' },
                                { icon: 'chat-processing-outline', label: 'Chat trực tuyến', color: '#333', route: 'ChatAI' },
                            ].map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.homeUtilityItem}
                                    onPress={() => {
                                        if (item.route) navigation.navigate(item.route);
                                        else Alert.alert('Thông báo', 'Tính năng đang được phát triển');
                                    }}
                                >
                                    <MaterialCommunityIcons name={item.icon as any} size={26} color={item.color} />
                                    <Text style={styles.homeUtilityLabel}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* PRODUCT LIST */}
                    {isLoadingProducts ? (
                        <ActivityIndicator color="#d70018" style={{ margin: 20 }} />
                    ) : (
                        <>
                            <View style={styles.productGrid}>
                                {paginatedProducts.map((item: any) => (
                                    <ProductCard
                                        key={item._id}
                                        product={item}
                                        onPress={() => navigation.navigate('ProductDetail', { product: item })}
                                    />
                                ))}
                            </View>

                            {/* Nút điều hướng phân trang */}
                            {totalPages > 1 && (
                                <View style={styles.paginationRow}>
                                    <TouchableOpacity
                                        style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                                        disabled={currentPage === 1}
                                        onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    >
                                        <Ionicons name="chevron-back" size={14} color={currentPage === 1 ? '#ccc' : '#d70018'} />
                                        <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>Trước</Text>
                                    </TouchableOpacity>

                                    <Text style={styles.pageInfoText}>
                                        Trang {currentPage} / {totalPages}
                                    </Text>

                                    <TouchableOpacity
                                        style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                                        disabled={currentPage === totalPages}
                                        onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    >
                                        <Text style={[styles.pageButtonText, currentPage === totalPages && styles.pageButtonTextDisabled]}>Sau</Text>
                                        <Ionicons name="chevron-forward" size={14} color={currentPage === totalPages ? '#ccc' : '#d70018'} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },

    // Header
    headerWrapper: { backgroundColor: '#f8f9fa' },
    headerGradient: { paddingBottom: 20, paddingHorizontal: 15, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    searchBar: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', height: 40, borderRadius: 20, alignItems: 'center', paddingHorizontal: 15, elevation: 2 },
    searchPlaceholder: { color: '#999', marginLeft: 8, fontSize: 14 },
    iconButton: { padding: 5 },

    // Membership Card
    membershipContainer: { marginTop: -15, paddingHorizontal: 15, marginBottom: 20 },
    membershipCard: { borderRadius: 20, padding: 15, elevation: 5 },
    memberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    memberGreeting: { color: '#fff', fontSize: 12, opacity: 0.9 },
    memberName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    pointsBadge: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 15, alignItems: 'center', gap: 5 },
    pointsText: { color: '#fff', fontWeight: 'bold' },
    quickActions: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, paddingVertical: 15, justifyContent: 'space-around' },
    actionItem: { alignItems: 'center', width: '20%' },
    actionIcon: { marginBottom: 5 },
    actionLabel: { fontSize: 10, color: '#333', textAlign: 'center' },

    // Banner
    bannerSection: { paddingHorizontal: 15, marginBottom: 20 },
    bannerImage: { width: width - 30, height: 160, borderRadius: 15, marginRight: 15 },
    pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 5 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ddd' },
    dotActive: { width: 18, backgroundColor: '#d70018' },

    // Recommendation Section
    recommendSection: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 15, elevation: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
    miniLogo: { width: 24, height: 24, borderRadius: 5 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold' },
    tabScroll: { marginBottom: 15 },
    tabPill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    tabPillActive: { backgroundColor: '#fff', borderColor: '#d70018' },
    tabText: { color: '#64748b', fontWeight: '500' },
    tabTextActive: { color: '#d70018', fontWeight: 'bold' },

    // Grid
    productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

    homeUtilitySection: { backgroundColor: '#fff', margin: 15, borderRadius: 20, padding: 15, elevation: 3 },
    utilityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    seeAllText: { color: '#d70018', fontSize: 13, fontWeight: '500' },
    homeUtilityGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    homeUtilityItem: { width: '25%', alignItems: 'center', marginBottom: 15 },
    homeUtilityLabel: { fontSize: 10, textAlign: 'center', marginTop: 5, color: '#333' },

    // Flash Sale styles
    flashSaleSection: {
        marginHorizontal: 15,
        marginBottom: 20,
        borderRadius: 20,
        padding: 15,
        elevation: 6,
        shadowColor: '#cb1c22',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
    },
    flashSaleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    flashSaleTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    flashSaleTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        textTransform: 'uppercase',
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
    countdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countdownBox: {
        backgroundColor: '#fff',
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 4,
        minWidth: 26,
        alignItems: 'center',
    },
    countdownText: {
        color: '#cb1c22',
        fontWeight: 'bold',
        fontSize: 13,
    },
    countdownColon: {
        marginHorizontal: 3,
        fontWeight: 'bold',
        color: '#fff',
        fontSize: 16,
    },
    flashSaleList: {
        paddingRight: 10,
    },
    flashSaleCard: {
        width: 140,
        marginRight: 15,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 10,
        position: 'relative',
        borderWidth: 1,
        borderColor: '#f1f2f6',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    discountTag: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#ff4757',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        zIndex: 1,
    },
    discountText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },
    flashSaleImage: {
        width: '100%',
        height: 110,
        resizeMode: 'contain',
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 8,
    },
    flashSaleInfo: {
        alignItems: 'center',
    },
    flashSaleName: {
        fontSize: 12,
        color: '#333',
        marginBottom: 4,
        textAlign: 'center',
        fontWeight: '500',
    },
    storeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        paddingHorizontal: 4,
    },
    storeLogo: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 4,
        backgroundColor: '#f0f0f0',
    },
    storeName: {
        fontSize: 10,
        color: '#666',
        flex: 1,
    },
    flashSalePrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ff4757',
    },
    flashSaleOriginalPrice: {
        fontSize: 11,
        color: '#999',
        textDecorationLine: 'line-through',
        marginBottom: 6,
    },
    progressBarBg: {
        width: '100%',
        height: 14,
        backgroundColor: '#ffe8ec',
        borderRadius: 7,
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    progressBarFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#ff4757',
        borderRadius: 7,
    },
    progressBarLabel: {
        color: '#333',
        fontSize: 8,
        fontWeight: 'bold',
        zIndex: 1,
        textAlign: 'center',
    },

    // Notification badge on bell icon
    notifBadge: {
        position: 'absolute',
        top: -4,
        right: -6,
        backgroundColor: '#ffb800',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
    },
    notifBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },

    // Style phân trang trang chủ
    paginationRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 35,
        gap: 15,
    },
    pageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d70018',
        backgroundColor: '#fff',
        gap: 4,
        shadowColor: '#d70018',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    pageButtonDisabled: {
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
    },
    pageButtonText: {
        color: '#d70018',
        fontSize: 12,
        fontWeight: 'bold',
    },
    pageButtonTextDisabled: {
        color: '#94a3b8',
    },
    pageInfoText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '600',
    },
});