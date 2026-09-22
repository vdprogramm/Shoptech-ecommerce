import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axiosClient from '../api/axiosClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SuccessModal from '../components/SuccessModal';
import Constants from 'expo-constants';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const navigation = useNavigation<any>();
    const appVariant = Constants.expoConfig?.extra?.variant || 'customer';
    const isShipperApp = appVariant === 'shipper';

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
            return;
        }

        setIsSubmitting(true);
        try {
            const response: any = await axiosClient.post('/auth/login', { email, password });
            const token = response.token || response.accessToken || response.access_token;
            const userData = response.user || response.data?.user || response;
            
            setShowSuccessModal(true);
            
            // Wait for modal animation to finish before updating global state and unmounting
            setTimeout(async () => {
                await AsyncStorage.setItem('accessToken', token);
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                useAuthStore.setState({ token, user: userData, isLoading: false });
                setShowSuccessModal(false);
            }, 1500);

        } catch (error: any) {
            Alert.alert('Lỗi', error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
            setIsSubmitting(false);
        }
    };

    const primaryColor = '#cb1c22';

    return (
        <>
        <ImageBackground 
            source={isShipperApp ? { uri: 'https://images.unsplash.com/photo-1555626906-fcf10d6851b4?q=80&w=800&auto=format&fit=crop' } : require('../../assets/login-bg.png')} 
            style={styles.background}
        >
            {/* Lớp phủ mờ màu tối giúp nội dung nổi bật hơn */}
            <View style={[styles.overlay, isShipperApp && { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]} />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.wrapper}>
                        <View style={[styles.container, isShipperApp && { backgroundColor: 'rgba(255, 255, 255, 0.98)', borderRadius: 30 }]}>
                            <View style={styles.headerContainer}>
                                <Text style={[styles.title, { color: primaryColor }]}>
                                    {isShipperApp ? 'ST Driver' : 'ShopTech'}
                                </Text>
                                <Text style={styles.subtitle}>
                                    {isShipperApp ? 'Bật app nhận đơn - Kiếm tiền ngay!' : 'Chào mừng bạn trở lại!'}
                                </Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={[styles.inputContainer, isShipperApp && { borderColor: '#fbdada', backgroundColor: '#fef5f5' }]}>
                                    <Ionicons name="mail-outline" size={22} color={isShipperApp ? '#cb1c22' : "#666"} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email của bạn"
                                        placeholderTextColor="#aaa"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>

                                <View style={[styles.inputContainer, isShipperApp && { borderColor: '#fbdada', backgroundColor: '#fef5f5' }]}>
                                    <Ionicons name="lock-closed-outline" size={22} color={isShipperApp ? '#cb1c22' : "#666"} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Mật khẩu"
                                        placeholderTextColor="#aaa"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                        <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color={isShipperApp ? '#cb1c22' : "#666"} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={[styles.forgotPasswordText, { color: primaryColor }]}>Quên mật khẩu?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.button, { backgroundColor: primaryColor, shadowColor: primaryColor }]} 
                                onPress={handleLogin} 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        {isShipperApp ? 'BẮT ĐẦU CA LÀM' : 'ĐĂNG NHẬP'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {isShipperApp ? (
                                <View style={styles.footerContainer}>
                                    <Text style={[styles.footerText, { color: '#888', fontStyle: 'italic' }]}>Ứng dụng nội bộ dành cho đối tác giao hàng</Text>
                                </View>
                            ) : (
                                <View style={styles.footerContainer}>
                                    <Text style={styles.footerText}>Bạn chưa có tài khoản? </Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                        <Text style={[styles.footerLink, { color: primaryColor }]}>Đăng ký ngay</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
            <SuccessModal 
                visible={showSuccessModal} 
                title="Đăng nhập thành công!" 
                message={isShipperApp ? "Chúc bạn một ngày làm việc hiệu quả" : "Chào mừng bạn đến với ShopTech"} 
            />
        </>
    );
}

const styles = StyleSheet.create({
    background: { 
        flex: 1, 
        resizeMode: 'cover' 
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Phủ mờ background
    },
    scrollContent: {
        flexGrow: 1,
    },
    wrapper: { 
        flex: 1, 
        justifyContent: 'center', 
        padding: 20 
    },
    container: { 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        padding: 30, 
        borderRadius: 24, 
        elevation: 10, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15, 
        shadowRadius: 20 
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 35,
    },
    title: { 
        fontSize: 42, 
        fontWeight: '900', 
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
        fontWeight: '500'
    },
    inputGroup: {
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 14,
        marginBottom: 16,
        paddingHorizontal: 15,
        height: 55,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: { 
        flex: 1,
        height: '100%',
        color: '#333',
        fontSize: 16,
    },
    eyeIcon: {
        padding: 5,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 25,
    },
    forgotPasswordText: {
        fontWeight: '600',
        fontSize: 14,
    },
    button: { 
        height: 55, 
        borderRadius: 14, 
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: { 
        color: '#fff', 
        fontWeight: 'bold', 
        fontSize: 16,
        letterSpacing: 0.5
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 25,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    dividerText: {
        color: '#888',
        paddingHorizontal: 15,
        fontSize: 14,
        fontWeight: '500'
    },
    xButton: { 
        backgroundColor: '#000', 
        height: 55,
        flexDirection: 'row',
        borderRadius: 14, 
        alignItems: 'center',
        justifyContent: 'center', 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    xButtonText: { 
        color: '#fff', 
        fontWeight: 'bold', 
        fontSize: 16 
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        color: '#666',
        fontSize: 15,
    },
    footerLink: {
        color: '#cb1c22',
        fontWeight: 'bold',
        fontSize: 15,
    }
});