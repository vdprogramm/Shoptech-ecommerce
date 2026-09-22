import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useOrderStore } from '../store/orderStore';

export default function OrderTrackingDriverScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { orderId } = route.params || {};

    const [phase, setPhase] = useState<'handing_over' | 'finding_driver'>('handing_over');
    const [countdown, setCountdown] = useState(5); // 5s for handing_over
    const [canCancel, setCanCancel] = useState(false);
    
    const { cancelOrder } = useOrderStore(); 

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (phase === 'handing_over') {
            if (countdown > 0) {
                timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            } else {
                setPhase('finding_driver');
                setCountdown(180); // 3 phút = 180s
            }
        } else if (phase === 'finding_driver') {
            if (countdown > 0) {
                timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            } else {
                // Hết 3 phút chưa tìm được tài xế -> cho phép hủy
                setCanCancel(true);
            }
        }

        return () => clearTimeout(timer);
    }, [countdown, phase]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleCancelOrder = () => {
        Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn hủy đơn hàng này không?', [
            { text: 'Không', style: 'cancel' },
            { 
                text: 'Hủy đơn', 
                style: 'destructive',
                onPress: async () => {
                    if (orderId) {
                        const success = await cancelOrder(orderId);
                        if (success) {
                            Alert.alert('Thành công', 'Đã hủy đơn hàng thành công.');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'MainTabs' }],
                            });
                        } else {
                            Alert.alert('Lỗi', 'Không thể hủy đơn hàng lúc này, vui lòng thử lại.');
                        }
                    } else {
                        Alert.alert('Thành công', 'Đã hủy đơn hàng thành công.');
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'MainTabs' }],
                        });
                    }
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('MyOrders')}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trạng thái đơn hàng</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                <ActivityIndicator size="large" color="#d70018" style={{ marginBottom: 20 }} />

                {phase === 'handing_over' ? (
                    <>
                        <Ionicons name="cube-outline" size={80} color="#007bff" style={styles.icon} />
                        <Text style={styles.statusText}>Đang bàn giao cho đơn vị vận chuyển</Text>
                        <Text style={styles.countdownText}>{countdown}s</Text>
                    </>
                ) : (
                    <>
                        <Ionicons name="bicycle-outline" size={80} color="#ff9800" style={styles.icon} />
                        <Text style={styles.statusText}>Đang đợi tìm tài xế...</Text>
                        
                        {!canCancel ? (
                            <Text style={styles.countdownText}>
                                {formatTime(countdown)}
                            </Text>
                        ) : (
                            <Text style={styles.warningText}>
                                Đã quá thời gian tìm tài xế. Bạn có thể tiếp tục chờ hoặc hủy đơn.
                            </Text>
                        )}
                    </>
                )}

                {canCancel && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder}>
                        <Text style={styles.cancelBtnText}>Hủy đơn hàng</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4' },
    header: { backgroundColor: '#d70018', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    icon: { marginBottom: 20 },
    statusText: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 15 },
    countdownText: { fontSize: 36, fontWeight: 'bold', color: '#d70018', marginBottom: 20 },
    warningText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 },
    cancelBtn: { backgroundColor: '#dc3545', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 8, marginTop: 20 },
    cancelBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
