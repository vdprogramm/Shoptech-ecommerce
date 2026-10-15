import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ImageBackground, Linking } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';
import SuccessModal from '../components/SuccessModal';

export default function RegisterScreen() {
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const register = useAuthStore((state) => state.register);

    const setAuthData = useAuthStore((state) => state.setAuthData);
    const navigation = useNavigation<any>();

    useEffect(() => {
        const handleDeepLink = ({ url }: { url: string }) => {
            if (url) {
                const match = url.match(/token=([^&]+)/);
                if (match && match[1]) {
                    setIsSubmitting(true);
                    setAuthData(match[1]).then(() => {
                        setIsSubmitting(false);
                    });
                }
            }
        };

        Linking.getInitialURL().then(url => {
            if (url) handleDeepLink({ url });
        });

        const subscription = Linking.addEventListener('url', handleDeepLink);
        return () => subscription.remove();
    }, []);

    const handleRegister = async () => {
        if (!fullName || !email || !password) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }

        setIsSubmitting(true);
        try {
            await register(fullName, email, password);
            setShowSuccessModal(true);
        } catch (error: any) {
            Alert.alert('Lỗi', error?.message || 'Đăng ký thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ImageBackground source={require('../../assets/login-bg.png')} style={styles.background}>
            <View style={styles.wrapper}>
                <View style={styles.container}>
                    <Text style={styles.title}>Tạo Tài Khoản</Text>

                    <TextInput style={styles.input} placeholder="Họ và tên" value={fullName} onChangeText={setFullName} />
                    <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                    <TextInput style={styles.input} placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry={true} />

                    <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isSubmitting}>
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ĐĂNG KÝ</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <SuccessModal
                visible={showSuccessModal}
                title="Đăng ký thành công"
                message="Vui lòng kiểm tra Email để lấy mã OTP!"
                onClose={() => {
                    setShowSuccessModal(false);
                    navigation.navigate('VerifyOtp', { email: email });
                }}
            />
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1, resizeMode: 'cover' },
    wrapper: { flex: 1, justifyContent: 'center', padding: 20 },
    container: { backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 30, borderRadius: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#cb1c22' },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15, backgroundColor: '#f9f9f9' },
    button: { backgroundColor: '#cb1c22', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    socialButton: { backgroundColor: '#fff', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
    socialButtonText: { color: '#555', fontWeight: 'bold', fontSize: 16 },
    linkButton: { alignItems: 'center' },
    linkText: { color: '#cb1c22', fontSize: 14, fontWeight: 'bold' }
});