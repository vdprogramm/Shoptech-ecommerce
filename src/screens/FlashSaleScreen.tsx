import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useFlashSaleStore } from '../store/flashSaleStore';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function FlashSaleScreen() {
    const { activeSales, isLoading, fetchCurrentSale } = useFlashSaleStore();
    const navigation = useNavigation<any>();
    const [timeLengths, setTimeLengths] = useState<{ [key: string]: { hours: string; minutes: string; seconds: string } }>({});

    useEffect(() => {
        if (!activeSales || activeSales.length === 0) {
            fetchCurrentSale();
        }
    }, []);

    useEffect(() => {
        if (!activeSales || activeSales.length === 0) {
            setTimeLengths({});
            return;
        }

        const updateTimer = () => {
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
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [activeSales]);

    const renderProductItem = (item: any, index: number) => {
        const variant = item.variant;
        const product = variant?.product;
        if (!product) return null;

        const percentSold = Math.min((item.soldCount / item.quantityLimit) * 100, 100);

        return (
            <TouchableOpacity 
                key={index}
                style={styles.card}
                onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}
            >
                <Image source={{ uri: product.images?.[0] || 'https://via.placeholder.com/150' }} style={styles.image} />
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
                    
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

                    <View style={styles.priceRow}>
                        <Text style={styles.salePrice}>{item.salePrice?.toLocaleString('vi-VN')} đ</Text>
                        <Text style={styles.originalPrice}>{variant.price?.toLocaleString('vi-VN')} đ</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${percentSold}%` }]} />
                        <Text style={styles.progressBarLabel}>
                            {item.soldCount >= item.quantityLimit ? 'HẾT HÀNG' : `Đã bán ${item.soldCount}`}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#d70018', '#f43f5e']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Flash Sale</Text>
                <View style={{ width: 24 }} />
            </LinearGradient>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#d70018" />
                </View>
            ) : !activeSales || activeSales.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="flash-off-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Hiện không có chương trình Flash Sale nào đang diễn ra</Text>
                </View>
            ) : (
                <FlatList
                    data={activeSales}
                    keyExtractor={(sale) => sale._id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item: sale }) => {
                        const time = timeLengths[sale._id];
                        if (!time) return null;
                        
                        return (
                            <View style={{ marginBottom: 10 }}>
                                <LinearGradient 
                                    colors={['#cb1c22', '#ff4757']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={styles.timerContainer}
                                >
                                    <Text style={styles.timerLabel}>{sale.campaignName} - Kết thúc trong:</Text>
                                    <View style={styles.countdownRow}>
                                        <View style={styles.countdownBox}><Text style={styles.countdownText}>{time.hours}</Text></View>
                                        <Text style={styles.countdownColon}>:</Text>
                                        <View style={styles.countdownBox}><Text style={styles.countdownText}>{time.minutes}</Text></View>
                                        <Text style={styles.countdownColon}>:</Text>
                                        <View style={styles.countdownBox}><Text style={styles.countdownText}>{time.seconds}</Text></View>
                                    </View>
                                </LinearGradient>
                                <View style={styles.listContent}>
                                    {sale.items.map((prodItem: any, idx: number) => renderProductItem(prodItem, idx))}
                                </View>
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 15,
    },
    backBtn: { padding: 5 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { textAlign: 'center', marginTop: 15, color: '#666', fontSize: 16 },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        elevation: 4,
        shadowColor: '#cb1c22',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        marginBottom: 5,
    },
    timerLabel: { fontSize: 14, fontWeight: '900', marginRight: 10, color: '#fff', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 0.5 },
    countdownRow: { flexDirection: 'row', alignItems: 'center' },
    countdownBox: { backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, minWidth: 26, alignItems: 'center' },
    countdownText: { color: '#cb1c22', fontWeight: 'bold', fontSize: 13 },
    countdownColon: { marginHorizontal: 3, fontWeight: 'bold', color: '#fff', fontSize: 16 },
    listContent: { padding: 15 },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 10,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    image: { width: 100, height: 100, resizeMode: 'contain', borderRadius: 8, backgroundColor: '#f9f9f9' },
    info: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    name: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 },
    storeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    storeLogo: { width: 16, height: 16, borderRadius: 8, marginRight: 6, backgroundColor: '#f0f0f0' },
    storeName: { fontSize: 12, color: '#666', flex: 1 },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    salePrice: { fontSize: 16, fontWeight: 'bold', color: '#d70018', marginRight: 10 },
    originalPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' },
    progressBarBg: {
        width: '100%', height: 16, backgroundColor: '#ffe8ec', borderRadius: 8,
        overflow: 'hidden', position: 'relative', justifyContent: 'center', alignItems: 'center',
    },
    progressBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#ff4757', borderRadius: 8 },
    progressBarLabel: { color: '#333', fontSize: 10, fontWeight: 'bold', zIndex: 1, textAlign: 'center' },
});
