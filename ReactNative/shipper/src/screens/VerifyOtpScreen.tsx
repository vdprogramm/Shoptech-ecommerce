import React, { useState, useRef } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    Pressable,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import SuccessModal from '../components/SuccessModal';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyOtpScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    // Lấy email được truyền từ màn hình Register sang
    const email = route.params?.email || '';

    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const CELL_COUNT = 6;

    const verifyOtp = useAuthStore((state) => state.verifyOtp);

    const handleVerify = async () => {
        if (!otp || otp.length !== CELL_COUNT) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ 6 số OTP');
            return;
        }

        setIsSubmitting(true);
        try {
            // Gọi API xác thực
            await verifyOtp(email, otp);
            
            // Hiển thị modal thành công đẹp mắt
            setShowSuccessModal(true);
        } catch (error: any) {
            Alert.alert('Xác thực thất bại', error?.message || 'Mã OTP không chính xác');
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <ImageBackground source={require('../../assets/login-bg.png')} style={styles.background}>
                <View style={styles.overlay} />
                
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        <View style={styles.wrapper}>
                            <View style={styles.container}>
                                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                                    <Ionicons name="arrow-back" size={24} color="#333" />
                                </TouchableOpacity>

                                <View style={styles.headerContainer}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="mail-unread-outline" size={50} color="#cb1c22" />
                                    </View>
                                    <Text style={styles.title}>Xác thực Email</Text>
                                    <Text style={styles.subtitle}>Nhập mã gồm 6 số được gửi tới:</Text>
                                    <Text style={styles.emailText}>{email}</Text>
                                </View>

                                <Pressable style={styles.otpWrapper} onPress={() => inputRef.current?.focus()}>
                                    <View style={styles.otpContainer}>
                                        {Array(CELL_COUNT).fill(0).map((_, i) => (
                                            <View key={i} style={[
                                                styles.otpCell,
                                                i === otp.length && styles.otpCellActive,
                                                otp[i] && styles.otpCellFilled
                                            ]}>
                                                <Text style={styles.otpText}>{otp[i] || ''}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <TextInput
                                        ref={inputRef}
                                        style={styles.hiddenInput}
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        maxLength={CELL_COUNT}
                                        autoFocus={true}
                                    />
                                </Pressable>

                                <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>XÁC THỰC NGAY</Text>
                                    )}
                                </TouchableOpacity>

                                <View style={styles.footerContainer}>
                                    <Text style={styles.footerText}>Chưa nhận được mã? </Text>
                                    <TouchableOpacity>
                                        <Text style={styles.resendText}>Gửi lại</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </ImageBackground>

            <SuccessModal 
                visible={showSuccessModal} 
                title="Xác thực thành công!" 
                message="Tài khoản của bạn đã được kích hoạt. Đang chuyển hướng..." 
                onClose={() => {
                    setShowSuccessModal(false);
                    navigation.navigate('Login');
                }}
            />
        </>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1, resizeMode: 'cover' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
    scrollContent: { flexGrow: 1 },
    wrapper: { flex: 1, justifyContent: 'center', padding: 20 },
    container: { 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        padding: 30, 
        paddingTop: 40,
        borderRadius: 24, 
        elevation: 10, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15, 
        shadowRadius: 20 
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        padding: 5
    },
    headerContainer: { alignItems: 'center', marginBottom: 30 },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(203, 28, 34, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    subtitle: { fontSize: 15, color: '#666', textAlign: 'center' },
    emailText: { fontSize: 16, fontWeight: '700', color: '#cb1c22', marginTop: 5 },
    otpWrapper: { position: 'relative', height: 65, marginBottom: 35 },
    otpContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    otpCell: { 
        width: 48, 
        height: 58, 
        borderWidth: 1.5, 
        borderColor: '#ddd', 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#f8f9fa' 
    },
    otpCellActive: { borderColor: '#cb1c22', borderWidth: 2, backgroundColor: '#fff', transform: [{scale: 1.05}] },
    otpCellFilled: { borderColor: '#cb1c22', backgroundColor: '#fff' },
    otpText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    hiddenInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
    button: { 
        backgroundColor: '#cb1c22', 
        height: 55, 
        borderRadius: 14, 
        justifyContent: 'center', 
        alignItems: 'center',
        shadowColor: '#cb1c22',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
    footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
    footerText: { color: '#666', fontSize: 15 },
    resendText: { color: '#cb1c22', fontWeight: 'bold', fontSize: 15 }
});