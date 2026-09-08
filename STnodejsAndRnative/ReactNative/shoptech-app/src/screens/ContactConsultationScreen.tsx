import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ContactConsultationScreen() {
    const navigation = useNavigation();

    const contactMethods = [
        { icon: 'phone', label: 'Gọi Hotline (Miễn phí)', detail: '1800 6969', color: '#d70018', action: () => Linking.openURL('tel:18006969') },
        { icon: 'email', label: 'Gửi Email Hỗ Trợ', detail: 'cskh@shoptech.com', color: '#1e88e5', action: () => Linking.openURL('mailto:cskh@shoptech.com') },
        { icon: 'chat-processing', label: 'Chat với nhân viên Zalo', detail: 'ShopTech Official', color: '#0068ff', action: () => {} },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Liên hệ tư vấn</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionDescription}>
                    Đội ngũ hỗ trợ của ShopTech luôn sẵn sàng giải đáp thắc mắc và hỗ trợ bạn 24/7. Vui lòng chọn phương thức liên hệ dưới đây:
                </Text>

                {contactMethods.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.contactCard} onPress={item.action}>
                        <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                            <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>{item.label}</Text>
                            <Text style={styles.contactDetail}>{item.detail}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: { padding: 5, marginRight: 10 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    content: { padding: 15 },
    sectionDescription: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 20 },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    contactInfo: { flex: 1 },
    contactLabel: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    contactDetail: { fontSize: 13, color: '#666' },
});
