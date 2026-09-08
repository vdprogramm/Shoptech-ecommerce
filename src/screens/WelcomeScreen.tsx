import React, { useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity,
    ImageBackground,
    SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
    const navigation = useNavigation<any>();
    const appVariant = Constants.expoConfig?.extra?.variant || 'customer';
    const isShipperApp = appVariant === 'shipper';

    const primaryColor = isShipperApp ? '#cb1c22' : '#007bff';
    const titleText = isShipperApp ? 'ST Driver' : 'ShopTech';
    const welcomeText = isShipperApp 
        ? 'Chào mừng đến với ứng dụng giao hàng' 
        : 'Chào mừng bạn đến với mua sắm';

    return (
        <ImageBackground 
            source={isShipperApp ? { uri: 'https://images.unsplash.com/photo-1555626906-fcf10d6851b4?q=80&w=800&auto=format&fit=crop' } : require('../../assets/login-bg.png')} 
            style={styles.background}
        >
            <View style={[styles.overlay, isShipperApp && { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]} />
            
            <SafeAreaView style={styles.container}>
                <View style={styles.contentContainer}>
                    <View style={styles.logoContainer}>
                        <Ionicons 
                            name={isShipperApp ? "bicycle" : "cart"} 
                            size={80} 
                            color={isShipperApp ? "#cb1c22" : "#fff"} 
                        />
                    </View>
                    
                    <Text style={[styles.title, isShipperApp && { color: '#cb1c22' }]}>
                        {titleText}
                    </Text>
                    
                    <Text style={styles.subtitle}>
                        {welcomeText}
                    </Text>
                </View>

                <View style={styles.bottomContainer}>
                    <TouchableOpacity 
                        style={[styles.button, { backgroundColor: isShipperApp ? '#cb1c22' : '#007bff' }]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.buttonText}>Tiếp tục</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logoContainer: {
        width: 120,
        height: 120,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: '#eee',
        textAlign: 'center',
        lineHeight: 28,
        fontWeight: '500',
        paddingHorizontal: 20,
    },
    bottomContainer: {
        padding: 30,
        paddingBottom: 50,
    },
    button: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    }
});
