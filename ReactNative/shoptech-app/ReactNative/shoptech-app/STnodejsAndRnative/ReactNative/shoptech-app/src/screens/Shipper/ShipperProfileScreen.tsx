import React from 'react';
import { Platform,  View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Alert, Image, ActivityIndicator  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import axiosClient from '../../api/axiosClient';
import { BASE_URL } from '../../api/axiosClient';

// Đưa MenuItem ra ngoài component chính
const MenuItem = ({ icon, title, onPress, iconColor = "#cb1c22", showBorder = true, IconComponent = Ionicons }: any) => (
    <TouchableOpacity
        style={[styles.menuItem, !showBorder && { borderBottomWidth: 0 }]}
        onPress={onPress}
    >
        <View style={styles.menuItemLeft}>
            <IconComponent name={icon} size={22} color={iconColor} />
            <Text style={styles.menuItemText}>{title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
);

export default function ShipperProfileScreen() {
    const { logout, user, updateUser } = useAuthStore();
    const navigation = useNavigation<any>();
    const [isUploading, setIsUploading] = React.useState(false);

    const handleUploadAvatar = async () => {
        try {
            // Xin quyền truy cập thư viện ảnh
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Lỗi', 'Bạn cần cấp quyền truy cập thư viện ảnh để đổi avatar!');
                return;
            }

            // Mở thư viện ảnh
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const imageUri = result.assets[0].uri;
                setIsUploading(true);

                // Prepare Form Data
                const formData = new FormData();
                const filename = imageUri.split('/').pop() || 'avatar.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('file', {
                    uri: imageUri,
                    name: filename,
                    type,
                } as any);

                // 1. Upload ảnh
                const uploadRes: any = await axiosClient.post('/files/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                
                const avatarPath = uploadRes.path; // ex: /uploads/...

                // 2. Cập nhật profile
                await axiosClient.patch('/users/profile/update', { avatar: avatarPath });

                // 3. Cập nhật state
                await updateUser({ ...user, avatar: avatarPath });

                Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công!');
            }
        } catch (error: any) {
            console.error('Lỗi upload avatar:', error);
            Alert.alert('Lỗi', 'Không thể upload ảnh đại diện. Vui lòng thử lại!');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />
            <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>

                {/* HEADER PHONG CÁCH FPT SHOP */}
                <LinearGradient colors={['#cb1c22', '#f43f5e']} style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity style={styles.avatarContainer} onPress={handleUploadAvatar} disabled={isUploading}>
                            <View style={styles.avatarCircle}>
                                {user?.avatar ? (
                                    <Image 
                                        source={{ uri: user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}` }} 
                                        style={styles.avatarImage} 
                                    />
                                ) : (
                                    <Ionicons name="person" size={40} color="#cb1c22" />
                                )}
                                {isUploading && (
                                    <View style={styles.uploadingOverlay}>
                                        <ActivityIndicator size="small" color="#fff" />
                                    </View>
                                )}
                            </View>
                            <View style={styles.cameraIcon}>
                                <Ionicons name="camera" size={14} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{user?.fullName || user?.name || 'Shipper'}</Text>
                            <View style={styles.phoneRow}>
                                <Text style={styles.userPhone}>{user?.email || user?.phone || 'Chưa cập nhật'}</Text>
                                <Ionicons name="eye-off-outline" size={14} color="#f0f0f0" style={{ marginLeft: 8 }} />
                            </View>

                            {/* Badge Shipper */}
                            <View style={styles.roleBadge}>
                                <Ionicons name="bicycle" size={14} color="#fff" style={{ marginRight: 4 }} />
                                <Text style={styles.roleText}>Tài xế đối tác</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Notifications')}>
                            <Ionicons name="notifications-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* BANNER XÁC THỰC OVERLAP HEADER */}
                <View style={styles.bannerWrapper}>
                    <LinearGradient colors={['#fff4f4', '#ffebe9']} style={styles.verifyBanner}>
                        <View style={styles.verifyIconBg}>
                            <MaterialCommunityIcons name="badge-account-horizontal-outline" size={20} color="#cb1c22" />
                        </View>
                        <Text style={styles.verifyText} numberOfLines={2}>
                            Cập nhật Giấy phép lái xe & Phương tiện để bắt đầu nhận đơn.
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#cb1c22" />
                    </LinearGradient>
                </View>

                {/* KHỐI ĐƠN HÀNG */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Nghiệp vụ giao hàng</Text>
                    <View style={styles.orderSteps}>
                        <TouchableOpacity style={styles.stepItem} onPress={() => navigation.navigate('PendingOrders')}>
                            <MaterialCommunityIcons name="bell-ring-outline" size={28} color="#555" />
                            <Text style={styles.stepText}>Yêu cầu mới</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.stepItem} onPress={() => navigation.navigate('PendingOrders')}>
                            <MaterialCommunityIcons name="package-up" size={28} color="#555" />
                            <Text style={styles.stepText}>Đang lấy</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.stepItem} onPress={() => navigation.navigate('PendingOrders')}>
                            <MaterialCommunityIcons name="truck-fast-outline" size={28} color="#555" />
                            <Text style={styles.stepText}>Đang giao</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <MenuItem icon="cube-outline" title="Đơn hàng đang chờ" onPress={() => navigation.navigate('PendingOrders')} />
                    <MenuItem icon="time-outline" title="Lịch sử chuyến đi" onPress={() => navigation.navigate('TripHistory')} showBorder={false} />
                </View>

                {/* KHỐI TÀI KHOẢN SHIPPER */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Tài khoản</Text>
                    <MenuItem icon="person-outline" title="Thông tin cá nhân" onPress={() => navigation.navigate('ShipperPersonalInfo')} iconColor="#333" showBorder={false} />
                </View>

                {/* NÚT ĐĂNG XUẤT */}
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#cb1c22' },
    container: { flex: 1, backgroundColor: '#f4f6f8' },

    // Header Đỏ
    header: {
        padding: 16,
        paddingBottom: 35,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    headerTop: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { marginRight: 15, position: 'relative' },
    avatarCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ffeb3b',
        overflow: 'hidden'
    },
    avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#cb1c22',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff'
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    userInfo: { flex: 1 },
    userName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    userPhone: { fontSize: 13, color: '#f0f0f0' },

    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 15,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginTop: 8,
        alignSelf: 'flex-start'
    },
    roleText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

    notificationBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

    // Banner Overlap
    bannerWrapper: {
        paddingHorizontal: 16,
        marginTop: -25, // Kéo lên đè vào Header
        marginBottom: 16,
    },
    verifyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        elevation: 5,
        shadowColor: '#cb1c22',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        borderWidth: 1,
        borderColor: '#fce8e8'
    },
    verifyIconBg: {
        backgroundColor: '#fff',
        padding: 6,
        borderRadius: 10,
        marginRight: 10
    },
    verifyText: { fontSize: 12, color: '#333', flex: 1, lineHeight: 18 },

    // Card
    card: { backgroundColor: '#fff', borderRadius: 15, marginHorizontal: 16, marginBottom: 16, padding: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 15 },

    orderSteps: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10, marginTop: 5 },
    stepItem: { alignItems: 'center', width: '30%' },
    stepText: { fontSize: 12, color: '#555', textAlign: 'center', marginTop: 8, fontWeight: '500' },

    divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },

    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
    menuItemText: { marginLeft: 12, fontSize: 15, color: '#333' },

    logoutButton: {
        marginHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cb1c22',
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 20
    },
    logoutText: { color: '#cb1c22', fontWeight: 'bold', fontSize: 15 }
});