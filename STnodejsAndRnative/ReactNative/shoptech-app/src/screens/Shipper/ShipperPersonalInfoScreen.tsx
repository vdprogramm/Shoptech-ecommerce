import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Image, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import axiosClient, { BASE_URL } from '../../api/axiosClient';

// LƯU Ý: KHÔNG DÙNG EXPORT DEFAULT ĐỂ TRÁNH LỖI IMPORT
export function ShipperPersonalInfoScreen() {
    const navigation = useNavigation<any>();
    const { user, updateUser } = useAuthStore();

    const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');
    const [isUploading, setIsUploading] = useState(false);

    const handleUploadAvatar = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Lỗi', 'Bạn cần cấp quyền truy cập thư viện ảnh!');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const imageUri = result.assets[0].uri;
                setIsUploading(true);

                const formData = new FormData();
                const filename = imageUri.split('/').pop() || 'avatar.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('file', {
                    uri: imageUri,
                    name: filename,
                    type,
                } as any);

                const uploadRes: any = await axiosClient.post('/files/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                const avatarPath = uploadRes.path;

                // Update server
                await axiosClient.patch('/users/profile/update', { avatar: avatarPath });

                // Update local store
                await updateUser({ ...user, avatar: avatarPath });

                Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công!');
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể upload ảnh. Vui lòng thử lại.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            // Cập nhật lên backend
            await axiosClient.patch('/users/profile/update', { fullName, phone, address });
            // Cập nhật vào store
            updateUser({ ...user, fullName, phone, address });
            Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng kiểm tra lại kết nối.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

                <LinearGradient colors={['#cb1c22', '#f43f5e']} style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
                    <View style={{ width: 36 }} />
                </LinearGradient>

                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

                    <View style={styles.avatarSection}>
                        <TouchableOpacity style={styles.avatarContainer} onPress={handleUploadAvatar} disabled={isUploading}>
                            <View style={styles.avatarCircle}>
                                {user?.avatar ? (
                                    <Image
                                        source={{ uri: user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}` }}
                                        style={styles.avatarImage}
                                    />
                                ) : (
                                    <Ionicons name="person" size={50} color="#cb1c22" />
                                )}
                                {isUploading && (
                                    <View style={styles.uploadingOverlay}>
                                        <ActivityIndicator size="small" color="#fff" />
                                    </View>
                                )}
                            </View>
                            <View style={styles.cameraIcon}>
                                <Ionicons name="camera" size={16} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.avatarHint}>Chạm để thay đổi ảnh</Text>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Họ và tên</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Nhập họ và tên"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Số điện thoại</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Nhập số điện thoại"
                                    keyboardType="phone-pad"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>


                    </View>

                    <TouchableOpacity style={styles.saveButtonContainer} onPress={handleSave}>
                        <LinearGradient colors={['#cb1c22', '#f43f5e']} style={styles.saveButton}>
                            <Text style={styles.saveButtonText}>CẬP NHẬT THÔNG TIN</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#cb1c22' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 25,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContainer: {
        padding: 20,
        backgroundColor: '#f4f6f8',
        flexGrow: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -15,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 15,
        marginBottom: 25,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#cb1c22',
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
    },
    avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#cb1c22',
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 3,
    },
    avatarHint: {
        fontSize: 13,
        color: '#666',
        marginTop: 8,
        fontStyle: 'italic'
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    inputGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 52,
        fontSize: 15,
        color: '#333',
    },
    textAreaContainer: {
        alignItems: 'flex-start',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 14,
    },
    saveButtonContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#cb1c22',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        marginBottom: 30,
    },
    saveButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});