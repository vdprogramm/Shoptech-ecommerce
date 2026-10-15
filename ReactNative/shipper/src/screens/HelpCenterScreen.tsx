import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function HelpCenterScreen() {
    const navigation = useNavigation();

    const faqList = [
        { question: 'Làm thế nào để đặt hàng?', answer: 'Bạn có thể tìm kiếm sản phẩm, thêm vào giỏ hàng và tiến hành thanh toán qua ứng dụng.' },
        { question: 'Chính sách đổi trả như thế nào?', answer: 'Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày đối với các sản phẩm lỗi do nhà sản xuất.' },
        { question: 'Làm sao để theo dõi đơn hàng?', answer: 'Bạn có thể vào mục "Theo dõi đơn" ở trang chủ để xem trạng thái đơn hàng của mình.' },
        { question: 'Phương thức thanh toán?', answer: 'Chúng tôi hỗ trợ thanh toán khi nhận hàng (COD), thẻ tín dụng và ví điện tử.' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trung tâm trợ giúp</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
                {faqList.map((item, index) => (
                    <View key={index} style={styles.faqCard}>
                        <Text style={styles.question}>{item.question}</Text>
                        <Text style={styles.answer}>{item.answer}</Text>
                    </View>
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
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    faqCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    question: { fontSize: 14, fontWeight: 'bold', color: '#d70018', marginBottom: 5 },
    answer: { fontSize: 13, color: '#555', lineHeight: 20 },
});
