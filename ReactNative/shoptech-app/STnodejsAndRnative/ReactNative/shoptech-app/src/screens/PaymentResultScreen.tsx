import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Map mã lỗi VNPAY → thông báo tiếng Việt
const VNPAY_ERROR_MAP: Record<string, string> = {
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên hệ VNPAY).',
    '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.',
    '10': 'Xác thực thông tin thẻ/tài khoản quá 3 lần.',
    '11': 'Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại.',
    '12': 'Thẻ/Tài khoản bị khóa.',
    '13': 'Mã OTP không đúng. Vui lòng thực hiện lại.',
    '24': 'Giao dịch đã bị hủy.',
    '51': 'Tài khoản không đủ số dư.',
    '65': 'Tài khoản vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
    '97': 'Chữ ký không hợp lệ.',
    '99': 'Lỗi không xác định. Vui lòng liên hệ hỗ trợ.',
};

export default function PaymentResultScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { isSuccess, rspCode, orderCode } = route.params || {};

    const errorMessage = !isSuccess && rspCode
        ? (VNPAY_ERROR_MAP[rspCode] || `Giao dịch thất bại (Mã lỗi: ${rspCode}).`)
        : '';

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* ICON */}
                <View style={[styles.iconCircle, { backgroundColor: isSuccess ? '#e8f5e9' : '#fdecea' }]}>
                    <Ionicons
                        name={isSuccess ? 'checkmark-circle' : 'close-circle'}
                        size={90}
                        color={isSuccess ? '#2e7d32' : '#d32f2f'}
                    />
                </View>

                {/* TIÊU ĐỀ */}
                <Text style={[styles.title, { color: isSuccess ? '#2e7d32' : '#d32f2f' }]}>
                    {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
                </Text>

                {/* MÔ TẢ */}
                <Text style={styles.description}>
                    {isSuccess
                        ? 'Cảm ơn bạn đã mua hàng. Đơn hàng đang được xử lý và sẽ sớm được giao đến bạn.'
                        : errorMessage || 'Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.'}
                </Text>

                {/* MÃ ĐƠN HÀNG */}
                {orderCode ? (
                    <View style={styles.orderCodeBox}>
                        <Text style={styles.orderCodeLabel}>Mã giao dịch</Text>
                        <Text style={styles.orderCodeValue}>{orderCode}</Text>
                    </View>
                ) : null}

                {/* CÁC NÚT */}
                <View style={styles.buttons}>
                    {isSuccess ? (
                        <>
                            <TouchableOpacity
                                style={[styles.btn, styles.btnPrimary]}
                                onPress={() => navigation.navigate('MyOrders')}
                            >
                                <Ionicons name="receipt-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.btnPrimaryText}>Xem đơn hàng</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.btn, styles.btnSecondary]}
                                onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
                            >
                                <Ionicons name="storefront-outline" size={18} color="#d70018" style={{ marginRight: 8 }} />
                                <Text style={styles.btnSecondaryText}>Tiếp tục mua sắm</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[styles.btn, styles.btnPrimary]}
                                onPress={() => navigation.navigate('Cart')}
                            >
                                <Ionicons name="refresh-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.btnPrimaryText}>Thử lại</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.btn, styles.btnSecondary]}
                                onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
                            >
                                <Ionicons name="home-outline" size={18} color="#d70018" style={{ marginRight: 8 }} />
                                <Text style={styles.btnSecondaryText}>Về trang chủ</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 50 },

    iconCircle: {
        width: 150, height: 150, borderRadius: 75,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 28,
    },

    title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 14 },

    description: {
        fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 24, marginBottom: 24,
    },

    orderCodeBox: {
        backgroundColor: '#f4f6f8', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24,
        alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: '#e0e0e0',
    },
    orderCodeLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
    orderCodeValue: { fontSize: 16, fontWeight: 'bold', color: '#333', letterSpacing: 1 },

    buttons: { width: '100%', gap: 12 },

    btn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 15, borderRadius: 12,
    },
    btnPrimary: { backgroundColor: '#d70018' },
    btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    btnSecondary: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#d70018' },
    btnSecondaryText: { color: '#d70018', fontSize: 16, fontWeight: 'bold' },
});
