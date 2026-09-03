import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    onClose: () => void;
}

export default function CustomAlert({ visible, title, message, type = 'info', onClose }: CustomAlertProps) {
    const scaleValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleValue, {
                toValue: 1,
                useNativeDriver: true,
                friction: 5,
                tension: 40
            }).start();
        } else {
            scaleValue.setValue(0);
        }
    }, [visible, scaleValue]);

    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'close-circle';
            case 'warning': return 'warning';
            default: return 'information-circle';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success': return '#28a745';
            case 'error': return '#ff4757';
            case 'warning': return '#ffb800';
            default: return '#007bff';
        }
    };

    return (
        <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Animated.View style={[styles.alertContainer, { transform: [{ scale: scaleValue }] }]}>
                    <View style={[styles.iconContainer, { backgroundColor: getColor() }]}>
                        <Ionicons name={getIcon()} size={48} color="#fff" />
                    </View>
                    
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    
                    <TouchableOpacity style={[styles.button, { backgroundColor: getColor() }]} onPress={onClose}>
                        <Text style={styles.buttonText}>OK</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    alertContainer: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -60,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        borderWidth: 4,
        borderColor: '#fff'
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center'
    },
    message: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22
    },
    button: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center'
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    }
});
