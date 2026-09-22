import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../../store/userStore';

export default function AdminCreateUserScreen() {
    const navigation = useNavigation();
    const { createUser } = useUserStore();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async () => {
        if (!name || !email || !password) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin!');
            return;
        }

        setIsSubmitting(true);
        try {
            // Mặc định tạo tài khoản với quyền STAFF (Nhân viên)
            const userData = {
                fullName: name, // Ánh xạ biến name của App vào trường fullName của DB
                email,
                password,
                roles: ['STAFF']
            };

            await createUser(userData);

            Alert.alert('Thành công', 'Đã tạo tài khoản nhân viên mới!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            const errorMessage = Array.isArray(error?.message)
                ? error.message.join('\n')
                : (error?.message || 'Email này có thể đã tồn tại hoặc không hợp lệ.');
            Alert.alert('Lỗi', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tạo Nhân Viên Mới</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.formContainer}>
                <Text style={styles.label}>Họ và Tên</Text>
                <TextInput style={styles.input} placeholder="Nhập tên nhân viên" value={name} onChangeText={setName} />

                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} placeholder="nhanvien@shoptech.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

                <Text style={styles.label}>Mật khẩu</Text>
                <TextInput style={styles.input} placeholder="Tạo mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />

                <TouchableOpacity style={styles.submitButton} onPress={handleCreate} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>TẠO TÀI KHOẢN</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#dc3545', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    formContainer: { padding: 20 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, fontSize: 16 },
    submitButton: { backgroundColor: '#28a745', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});