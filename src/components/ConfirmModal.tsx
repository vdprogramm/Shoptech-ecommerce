import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConfirmModalProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    hideCancel?: boolean;
    iconName?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    confirmColor?: string;
}

export default function ConfirmModal({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    hideCancel = false,
    iconName = 'help-circle-outline',
    iconColor = '#007bff',
    confirmColor = '#007bff'
}: ConfirmModalProps) {
    const scaleValue = useRef(new Animated.Value(0)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleValue, {
                    toValue: 1,
                    friction: 6,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleValue.setValue(0);
            opacityValue.setValue(0);
        }
    }, [visible]);

    const handleClose = (action: () => void) => {
        Animated.parallel([
            Animated.timing(opacityValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            action();
        });
    };

    if (!visible) return null;

    return (
        <Modal transparent animationType="none" visible={visible} onRequestClose={() => handleClose(onCancel)}>
            <TouchableWithoutFeedback onPress={() => handleClose(onCancel)}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.container,
                                {
                                    opacity: opacityValue,
                                    transform: [{ scale: scaleValue }],
                                },
                            ]}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                                <Ionicons name={iconName} size={42} color={iconColor} />
                            </View>
                            
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.message}>{message}</Text>
                            
                            <View style={styles.buttonContainer}>
                                {!hideCancel && (
                                    <TouchableOpacity 
                                        style={[styles.button, styles.cancelButton]} 
                                        onPress={() => handleClose(onCancel)}
                                    >
                                        <Text style={styles.cancelText}>{cancelText}</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity 
                                    style={[styles.button, styles.confirmButton, { backgroundColor: confirmColor }, hideCancel && { flex: 0, paddingHorizontal: 40 }]} 
                                    onPress={() => handleClose(onConfirm)}
                                >
                                    <Text style={styles.confirmText}>{confirmText}</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    iconContainer: {
        width: 76,
        height: 76,
        borderRadius: 38,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 26,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#eee',
    },
    confirmButton: {
        // Background color handled in inline style
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 3,
    },
    cancelText: {
        color: '#666',
        fontSize: 16,
        fontWeight: 'bold',
    },
    confirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
