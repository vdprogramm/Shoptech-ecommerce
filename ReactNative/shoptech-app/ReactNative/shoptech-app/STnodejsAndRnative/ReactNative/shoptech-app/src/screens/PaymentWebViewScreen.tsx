import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentWebViewScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { paymentUrl } = route.params;
    const webViewRef = useRef<WebView>(null);

    const handleNavigationStateChange = (navState: any) => {
        const url = navState.url;

        // TỐI QUAN TRỌNG: Chỉ bắt khi Backend ĐÃ XỬ LÝ XONG và chủ động đá về 'payment-result'
        // Tuyệt đối KHÔNG bắt 'vnpay_return' để Backend có cơ hội nhận dữ liệu
        const isFrontendRedirect = url.includes('payment-result');

        if (isFrontendRedirect) {
            // Lúc này Backend đã cập nhật 'Paid' xong, ta mới phanh WebView lại 
            // để điện thoại không bị báo lỗi không tìm thấy localhost
            if (webViewRef.current) {
                webViewRef.current.stopLoading();
            }

            // Parse toàn bộ query params từ URL
            const queryString = url.includes('?') ? url.split('?')[1] : '';
            const params = new URLSearchParams(queryString);

            const rspCode = params.get('vnp_ResponseCode') || params.get('rspCode');
            const orderCode = params.get('vnp_TxnRef') || params.get('orderId') || route.params?.orderId;
            const isSuccess = rspCode === '00';

            // Điều hướng sang màn hình kết quả
            navigation.replace('PaymentResult', {
                isSuccess,
                rspCode,
                orderCode,
                url,
            });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cổng thanh toán VNPAY</Text>
            </View>
            <WebView
                ref={webViewRef}
                source={{ uri: paymentUrl }}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#d70018" />
                    </View>
                )}
                onNavigationStateChange={handleNavigationStateChange}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#f8f8f8' },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)' }
});