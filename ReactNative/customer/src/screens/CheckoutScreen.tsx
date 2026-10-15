import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Linking, Switch } from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '../store/cartStore';
import { useAddressStore } from '../store/addressStore';
import { useOrderStore } from '../store/orderStore';
import { useVoucherStore } from '../store/voucherStore';
import { useShippingMethodStore } from '../store/shippingMethodStore';
import { useAuthStore } from '../store/authStore';
import { useFlashSaleStore } from '../store/flashSaleStore';
import axiosClient from '../api/axiosClient';

export default function CheckoutScreen() {
    const navigation = useNavigation<any>();

    // Rút dữ liệu từ các store
    const { items: rawItems, clearCart } = useCartStore();
    const { currentSale } = useFlashSaleStore();

    const items = React.useMemo(() => {
        return rawItems.map(item => {
            let displayPrice = item.price;
            let originalPrice = item.originalPrice; // fallback
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

    const { addresses, fetchAddresses } = useAddressStore();
    const { createOrder } = useOrderStore();
    const { 
        vouchers, 
        appliedVoucher, 
        discountAmount, 
        fetchPublicVouchers, 
        validateAndApplyVoucher, 
        removeAppliedVoucher 
    } = useVoucherStore();
    const { shippingMethods, fetchActiveMethods } = useShippingMethodStore();
    const { user } = useAuthStore();

    const [voucherCodeInput, setVoucherCodeInput] = useState('');
    const [selectedShippingMethod, setSelectedShippingMethod] = useState<string | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('COD');
    const [pointsAvailable, setPointsAvailable] = useState(0);
    const [usePoints, setUsePoints] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{ visible: boolean, title: string, message: string, type: 'success'|'error'|'warning'|'info' }>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    const showAlert = (title: string, message: string, type: 'success'|'error'|'warning'|'info' = 'info') => {
        setAlertConfig({ visible: true, title, message, type });
    };
    
    const hideAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    useEffect(() => {
        fetchAddresses();
        fetchPublicVouchers();
        fetchActiveMethods();
        // Reset voucher khi vào trang thanh toán mới
        removeAppliedVoucher();

        const fetchPoints = async () => {
            try {
                const res: any = await axiosClient.get('/points/balance');
                const balance = res.totalPoints ?? res.points ?? res.balance ?? (typeof res === 'number' ? res : 0);
                setPointsAvailable(Number(balance) || 0);
            } catch (error) {
                console.log('Error fetching points:', error);
            }
        };
        if (user) {
            fetchPoints();
        }
    }, [user]);

    // Set default shipping method if available
    useEffect(() => {
        if (shippingMethods.length > 0 && !selectedShippingMethod) {
            setSelectedShippingMethod(shippingMethods[0]._id);
        }
    }, [shippingMethods]);

    // Tìm địa chỉ mặc định, nếu không có thì lấy đại cái đầu tiên
    const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];

    const shippingFee = shippingMethods.find(m => m._id === selectedShippingMethod)?.baseFee || 0;
    const prePointsTotal = Math.max(0, getTotalPrice() + shippingFee - discountAmount);
    const pointsDiscountAmount = usePoints ? Math.min(pointsAvailable * 1000, prePointsTotal) : 0;
    const finalTotal = prePointsTotal - pointsDiscountAmount;
    const pointsUsedToSend = usePoints ? Math.ceil(pointsDiscountAmount / 1000) : 0;

    const displayVouchers = React.useMemo(() => {
        const storeIdsInCart = new Set<string>();
        items.forEach(item => {
            const storeId = item.store?._id || item.store || item.storeId;
            if (storeId) {
                storeIdsInCart.add(storeId.toString());
            }
        });

        return vouchers.filter(voucher => {
            // Nếu voucher không có store -> do Admin tạo -> hiển thị cho tất cả
            if (!voucher.store) return true;
            
            // Nếu có store, kiểm tra xem trong giỏ hàng có sản phẩm của store đó không
            return storeIdsInCart.has(voucher.store.toString());
        });
    }, [vouchers, items]);

    const handleApplyVoucher = async (code: string) => {
        if (!code.trim()) {
            showAlert('Lưu ý', 'Vui lòng nhập mã giảm giá.', 'warning');
            return;
        }
        const total = getTotalPrice();
        
        // Tính tổng tiền theo từng cửa hàng để kiểm tra voucher dành riêng cho cửa hàng
        const storeSubtotals: Record<string, number> = {};
        items.forEach(item => {
            const storeId = item.store?._id || item.store || item.storeId;
            if (storeId) {
                const storeIdStr = storeId.toString();
                storeSubtotals[storeIdStr] = (storeSubtotals[storeIdStr] || 0) + (item.price * item.quantity);
            }
        });

        const res = await validateAndApplyVoucher(code.trim().toUpperCase(), total, storeSubtotals);
        if (res.success) {
            showAlert('Thành công', res.message, 'success');
        } else {
            showAlert('Thất bại', res.message, 'error');
        }
    };

    const handlePlaceOrder = async () => {
        if (!defaultAddress) {
            showAlert('Thiếu thông tin', 'Vui lòng thêm địa chỉ giao hàng!', 'warning');
            navigation.navigate('AddressBook'); // Chuyển sang trang tạo địa chỉ
            return;
        }

        const fullAddress = `${defaultAddress.name || 'Người nhận'} - ${defaultAddress.phone ? defaultAddress.phone + ' - ' : ''}${defaultAddress.street}, ${defaultAddress.ward}, ${defaultAddress.district}, ${defaultAddress.city}`;

        // Cấu trúc gói hàng gửi cho NestJS, đính kèm mã voucher nếu có
        const orderData = {
            shippingAddress: fullAddress,
            paymentMethod: selectedPaymentMethod,
            voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
            shippingMethod: selectedShippingMethod,
            pointsUsed: pointsUsedToSend
        };

        // Bóp cò!
        const createdOrder = await createOrder(orderData);

        if (createdOrder) {
            clearCart(); // Đặt xong thì dọn sạch giỏ
            removeAppliedVoucher(); // Gỡ voucher khỏi store
            setUsePoints(false); // Reset trạng thái dùng điểm
            
            const orderId = createdOrder._id || createdOrder.id;
            
            if (selectedPaymentMethod === 'VNPAY') {
                try {
                    const amount = finalTotal;
                    const res: any = await axiosClient.post(`/payments/create-url?orderId=${orderId}&amount=${amount}`);
                    const paymentUrl = res.data?.url || res.url;
                    if (paymentUrl) {
                        navigation.navigate('PaymentWebView', { paymentUrl, orderId });
                    }
                } catch (error) {
                    console.error('Lỗi tạo URL VNPAY:', error);
                    showAlert('Lỗi', 'Không thể tạo link thanh toán VNPAY', 'error');
                }
            } else {
                showAlert('Thành công!', 'Đơn hàng của bạn đã được đặt.', 'success');
                setTimeout(() => {
                    navigation.navigate('MyOrders'); 
                }, 1500);
            }
        } else {
            showAlert('Lỗi', 'Không thể đặt hàng lúc này.', 'error');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thanh toán</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* 1. KHU VỰC ĐỊA CHỈ */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="location" size={20} color="#d70018" />
                        <Text style={styles.sectionTitle}>Địa chỉ nhận hàng</Text>
                    </View>
                    {defaultAddress ? (
                        <TouchableOpacity style={styles.addressBox} onPress={() => navigation.navigate('AddressBook')}>
                            <Text style={styles.addressName}>{defaultAddress.name || 'Người nhận'}</Text>
                            <Text style={styles.addressText}>{defaultAddress.street}, {defaultAddress.ward}, {defaultAddress.district}, {defaultAddress.city}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#999" style={styles.arrowIcon} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.addAddressBtn} onPress={() => navigation.navigate('AddressBook')}>
                            <Text style={styles.addAddressText}>+ Thêm địa chỉ giao hàng</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* 2. TÓM TẮT ĐƠN HÀNG */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cart" size={20} color="#007bff" />
                        <Text style={styles.sectionTitle}>Tóm tắt đơn hàng ({items.length} sản phẩm)</Text>
                    </View>
                    {items.map(item => (
                        <View key={item.id} style={styles.itemRow}>
                            <Text style={styles.itemName} numberOfLines={1}>{item.quantity}x {item.name}</Text>
                            <View style={styles.priceContainer}>
                                {item.originalPrice && (
                                    <Text style={styles.originalItemPrice}>{(item.originalPrice * item.quantity).toLocaleString('vi-VN')} đ</Text>
                                )}
                                <Text style={styles.itemPrice}>{(item.price * item.quantity).toLocaleString('vi-VN')} đ</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 3. KHU VỰC VOUCHER / MÃ GIẢM GIÁ */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="ticket" size={20} color="#ffb800" />
                        <Text style={styles.sectionTitle}>Mã giảm giá (Voucher)</Text>
                    </View>

                    {/* Ô nhập mã giảm giá */}
                    <View style={styles.voucherInputRow}>
                        <TextInput
                            style={styles.voucherInput}
                            placeholder="Nhập mã giảm giá..."
                            placeholderTextColor="#999"
                            value={voucherCodeInput}
                            onChangeText={setVoucherCodeInput}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity
                            style={styles.applyBtn}
                            onPress={() => handleApplyVoucher(voucherCodeInput)}
                        >
                            <Text style={styles.applyBtnText}>Áp dụng</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Voucher đang được áp dụng */}
                    {appliedVoucher && (
                        <View style={styles.appliedVoucherBadge}>
                            <View style={styles.appliedVoucherInfo}>
                                <Ionicons name="checkmark-circle" size={18} color="#28a745" />
                                <Text style={styles.appliedVoucherText} numberOfLines={1}>
                                    Đã áp dụng: <Text style={{ fontWeight: 'bold' }}>{appliedVoucher.code}</Text> (-{discountAmount.toLocaleString('vi-VN')} đ)
                                </Text>
                            </View>
                            <TouchableOpacity onPress={removeAppliedVoucher}>
                                <Ionicons name="close-circle" size={20} color="#ff4757" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Danh sách voucher công khai để chọn nhanh */}
                    {displayVouchers.length > 0 && (
                        <View style={styles.publicVoucherSection}>
                            <Text style={styles.subTitle}>Mã giảm giá dành cho bạn:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.voucherScroll}>
                                {displayVouchers.map((voucher) => {
                                    const isMinValueMet = getTotalPrice() >= voucher.minOrderValue;
                                    return (
                                        <TouchableOpacity
                                            key={voucher._id}
                                            style={[
                                                styles.voucherCard,
                                                !isMinValueMet && styles.voucherCardDisabled,
                                                appliedVoucher?.code === voucher.code && styles.voucherCardActive
                                            ]}
                                            disabled={!isMinValueMet}
                                            onPress={() => {
                                                setVoucherCodeInput(voucher.code);
                                                handleApplyVoucher(voucher.code);
                                            }}
                                        >
                                            <Text style={styles.voucherCode}>{voucher.code}</Text>
                                            <Text style={styles.voucherDesc}>
                                                Giảm {voucher.discountType === 'percent' 
                                                    ? `${voucher.discountAmount}%` 
                                                    : `${voucher.discountAmount.toLocaleString('vi-VN')}đ`
                                                }
                                            </Text>
                                            <Text style={styles.voucherMinVal}>
                                                Đơn tối thiểu: {(voucher.minOrderValue / 1000).toFixed(0)}k
                                            </Text>
                                            {!isMinValueMet && (
                                                <Text style={styles.voucherLockText}>Chưa đủ đ.kiện</Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* 3.5. F-POINT */}
                {pointsAvailable > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="star" size={20} color="#ffb800" />
                            <Text style={styles.sectionTitle}>F-point (Bạn có {pointsAvailable.toLocaleString('vi-VN')} điểm)</Text>
                        </View>
                        <View style={styles.pointsToggleRow}>
                            <Text style={styles.pointsToggleText}>
                                Dùng {Math.min(pointsAvailable, Math.ceil(prePointsTotal / 1000)).toLocaleString('vi-VN')} điểm để giảm 
                                {' '}<Text style={{fontWeight: 'bold', color: '#d70018'}}>{Math.min(pointsAvailable * 1000, prePointsTotal).toLocaleString('vi-VN')} đ</Text>
                            </Text>
                            <Switch 
                                value={usePoints} 
                                onValueChange={setUsePoints} 
                                trackColor={{ false: "#767577", true: "#ffb800" }}
                                thumbColor={usePoints ? "#fff" : "#f4f3f4"}
                            />
                        </View>
                    </View>
                )}

                {/* 4. PHƯƠNG THỨC VẬN CHUYỂN */}
                {shippingMethods.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="car" size={20} color="#ff9800" />
                            <Text style={styles.sectionTitle}>Phương thức vận chuyển</Text>
                        </View>
                        {shippingMethods.map(method => (
                            <TouchableOpacity
                                key={method._id}
                                style={[
                                    styles.shippingMethodBox,
                                    selectedShippingMethod === method._id && styles.shippingMethodBoxActive
                                ]}
                                onPress={() => setSelectedShippingMethod(method._id)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.shippingMethodName}>{method.name}</Text>
                                    <Text style={styles.shippingMethodDesc}>{method.estimatedDays}</Text>
                                    {method.description && (
                                        <Text style={styles.shippingMethodDesc} numberOfLines={1}>{method.description}</Text>
                                    )}
                                </View>
                                <Text style={styles.shippingMethodPrice}>
                                    {method.baseFee === 0 ? 'Miễn phí' : `${method.baseFee.toLocaleString('vi-VN')} đ`}
                                </Text>
                                <Ionicons
                                    name={selectedShippingMethod === method._id ? "radio-button-on" : "radio-button-off"}
                                    size={24}
                                    color={selectedShippingMethod === method._id ? "#d70018" : "#ccc"}
                                    style={{ marginLeft: 10 }}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* 5. PHƯƠNG THỨC THANH TOÁN */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cash" size={20} color="#28a745" />
                        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={[styles.paymentBox, selectedPaymentMethod === 'COD' && styles.paymentBoxActive]} 
                        onPress={() => setSelectedPaymentMethod('COD')}
                    >
                        <Text style={styles.paymentText}>Thanh toán khi nhận hàng (COD)</Text>
                        <Ionicons name={selectedPaymentMethod === 'COD' ? "radio-button-on" : "radio-button-off"} size={24} color={selectedPaymentMethod === 'COD' ? "#28a745" : "#ccc"} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.paymentBox, selectedPaymentMethod === 'VNPAY' && styles.paymentBoxActive]} 
                        onPress={() => setSelectedPaymentMethod('VNPAY')}
                    >
                        <Text style={styles.paymentText}>Thanh toán qua VNPAY</Text>
                        <Ionicons name={selectedPaymentMethod === 'VNPAY' ? "radio-button-on" : "radio-button-off"} size={24} color={selectedPaymentMethod === 'VNPAY' ? "#28a745" : "#ccc"} />
                    </TouchableOpacity>
                    

                </View>
            </ScrollView>

            {/* NÚT CHỐT ĐƠN */}
            <View style={styles.footer}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                    {(discountAmount > 0 || pointsDiscountAmount > 0) && (
                        <Text style={styles.originalPriceText}>
                            {(getTotalPrice() + shippingFee).toLocaleString('vi-VN')} đ
                        </Text>
                    )}
                    <Text style={styles.totalPrice}>
                        {finalTotal.toLocaleString('vi-VN')} đ
                    </Text>
                </View>
                <TouchableOpacity style={styles.checkoutBtn} onPress={handlePlaceOrder}>
                    <Text style={styles.checkoutBtnText}>ĐẶT HÀNG</Text>
                </TouchableOpacity>
            </View>

            <CustomAlert 
                visible={alertConfig.visible} 
                title={alertConfig.title} 
                message={alertConfig.message} 
                type={alertConfig.type} 
                onClose={hideAlert} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4' },
    header: { backgroundColor: '#d70018', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    section: { backgroundColor: '#fff', padding: 15, marginBottom: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8, color: '#333' },
    addressBox: { paddingRight: 30, position: 'relative' },
    addressName: { fontSize: 15, fontWeight: 'bold', marginBottom: 5 },
    addressText: { fontSize: 14, color: '#666', lineHeight: 20 },
    arrowIcon: { position: 'absolute', right: 0, top: '30%' },
    addAddressBtn: { padding: 15, borderWidth: 1, borderColor: '#d70018', borderRadius: 8, borderStyle: 'dashed', alignItems: 'center' },
    addAddressText: { color: '#d70018', fontWeight: 'bold' },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
    itemName: { flex: 1, fontSize: 14, color: '#333', paddingRight: 10 },
    priceContainer: { alignItems: 'flex-end' },
    itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    originalItemPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through', marginBottom: 2 },
    
    // Voucher Styles
    voucherInputRow: { flexDirection: 'row', gap: 10, marginBottom: 10, marginTop: 5 },
    voucherInput: { flex: 1, height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, color: '#333', fontSize: 14, backgroundColor: '#fafafa' },
    applyBtn: { backgroundColor: '#ff4757', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 6 },
    applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    appliedVoucherBadge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e8f5e9', padding: 10, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#c8e6c9' },
    appliedVoucherInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    appliedVoucherText: { color: '#2e7d32', fontSize: 13, flex: 1 },
    subTitle: { fontSize: 13, color: '#666', marginBottom: 8, fontWeight: '500' },
    publicVoucherSection: { marginTop: 10 },
    voucherScroll: { paddingVertical: 5 },
    voucherCard: { width: 110, padding: 8, borderWidth: 1, borderColor: '#ffb800', borderRadius: 8, backgroundColor: '#fffbe6', marginRight: 10, alignItems: 'center', position: 'relative' },
    voucherCardActive: { borderColor: '#28a745', backgroundColor: '#e8f5e9' },
    voucherCardDisabled: { borderColor: '#ddd', backgroundColor: '#f5f5f5' },
    voucherCode: { fontSize: 12, fontWeight: 'bold', color: '#ffb800' },
    voucherDesc: { fontSize: 11, fontWeight: 'bold', color: '#333', marginVertical: 3 },
    voucherMinVal: { fontSize: 9, color: '#666' },
    voucherLockText: { fontSize: 8, color: '#ff4757', marginTop: 2, fontWeight: 'bold' },

    pointsToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    pointsToggleText: { fontSize: 13, color: '#333', flex: 1, paddingRight: 10, lineHeight: 20 },

    paymentBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: '#eee', borderRadius: 8, backgroundColor: '#fafafa', marginBottom: 10 },
    paymentBoxActive: { borderColor: '#28a745', backgroundColor: '#f8fff9' },
    paymentText: { fontSize: 14, color: '#333', fontWeight: '500' },

    shippingMethodBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 10, backgroundColor: '#fafafa' },
    shippingMethodBoxActive: { borderColor: '#d70018', backgroundColor: '#fff5f5' },
    shippingMethodName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    shippingMethodDesc: { fontSize: 12, color: '#666' },
    shippingMethodPrice: { fontSize: 14, fontWeight: 'bold', color: '#d70018' },
    
    footer: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, justifyContent: 'space-between', alignItems: 'center', elevation: 15, borderTopWidth: 1, borderColor: '#eee' },
    totalLabel: { fontSize: 13, color: '#666' },
    originalPriceText: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' },
    totalPrice: { fontSize: 18, fontWeight: 'bold', color: '#d70018' },
    checkoutBtn: { backgroundColor: '#d70018', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 },
    checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});