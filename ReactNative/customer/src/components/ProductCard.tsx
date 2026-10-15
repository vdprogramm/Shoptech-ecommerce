import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 45) / 2;

interface ProductCardProps {
    product: any;
    onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <Image
                source={{ uri: product?.images?.[0] || 'https://via.placeholder.com/150' }}
                style={styles.image}
            />

            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={2}>
                    {product?.name}
                </Text>

                {product?.store && typeof product.store === 'object' && (
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

                <Text style={styles.price}>
                    {product?.price?.toLocaleString('vi-VN')} đ
                </Text>

                <View style={styles.footer}>
                    <Text style={styles.sold}>Đã bán {product?.soldCount || 0}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    image: {
        width: '100%',
        height: CARD_WIDTH,
        resizeMode: 'cover',
    },
    content: {
        padding: 10,
    },
    name: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        height: 40,
        marginBottom: 5,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ff4757',
    },
    footer: {
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    sold: {
        fontSize: 12,
        color: '#999',
    },
    storeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 4,
    },
    storeLogo: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 6,
        backgroundColor: '#f0f0f0',
    },
    storeName: {
        fontSize: 11,
        color: '#666',
        flex: 1,
    },
});

export default ProductCard;