import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Platform, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { BASE_URL } from '../api/axiosClient';

export default function AccountInfoScreen() {
    const navigation = useNavigation<any>();
    const { user, updateUser } = useAuthStore();
    const [avatarUri, setAvatarUri] = useState<string | null>((user as any)?.avatar || null);

    const handlePickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Quyền truy cập", "Bạn cần cấp quyền truy cập thư viện ảnh để đổi ảnh đại diện.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const newUri = result.assets[0].uri;
                setAvatarUri(newUri);
                updateUser({ ...user, avatar: newUri });
                Alert.alert("Thành công", "Đã cập nhật ảnh đại diện.");
            }
        } catch (error) {
            console.log("Lỗi chọn ảnh:", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi chọn ảnh.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông tin tài khoản</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <TouchableOpacity style={styles.avatarSection} onPress={handlePickImage} activeOpacity={0.8}>
                    <View style={styles.avatarCircle}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri.startsWith('http') || avatarUri.startsWith('file') ? avatarUri : `${BASE_URL}${avatarUri}` }} style={{ width: 90, height: 90, borderRadius: 45 }} />
                        ) : (
                            <Ionicons name="person" size={50} color="#bdbdbd" />
                        )}
                    </View>
                    <Text style={styles.avatarLabel}>Đổi ảnh đại diện</Text>
                </TouchableOpacity>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Họ và tên</Text>
                    <TextInput
                        style={styles.input}
                        value={user?.fullName || ''}
                        editable={false}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email / Số điện thoại</Text>
                    <TextInput
                        style={styles.input}
                        value={user?.email || ''}
                        editable={false}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Vai trò</Text>
                    <TextInput
                        style={styles.input}
                        value={user?.roles?.join(', ') || 'Khách hàng'}
                        editable={false}
                    />
                </View>

                <TouchableOpacity style={styles.updateBtn} onPress={() => alert('Tính năng cập nhật thông tin đang được phát triển')}>
                    <Text style={styles.updateBtnText}>Cập nhật thông tin</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        paddingTop: Platform.OS === 'android' ? 40 : 15,
        backgroundColor: '#cb1c22',
    },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    content: { padding: 20 },
    avatarSection: { alignItems: 'center', marginBottom: 30 },
    avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#ddd', overflow: 'hidden' },
    avatarLabel: { fontSize: 14, color: '#007bff', fontWeight: '500' },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, color: '#666', marginBottom: 8, fontWeight: '500' },
    input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, fontSize: 16, color: '#333' },
    updateBtn: { backgroundColor: '#cb1c22', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    updateBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
