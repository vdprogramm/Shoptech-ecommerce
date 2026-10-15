import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';

export default function AdminUserListScreen() {
    const navigation = useNavigation<any>();
    const { users, isLoading, fetchUsers, changeUserRole, deleteUser } = useUserStore();
    const currentUser = useAuthStore(state => state.user);

    // STATE QUẢN LÝ TAB (Mặc định hiển thị Nhân sự)
    const [activeTab, setActiveTab] = useState<'STAFF' | 'CUSTOMER'>('STAFF');

    useEffect(() => {
        fetchUsers();
    }, []);

    // LỌC DANH SÁCH THEO TAB
    const filteredUsers = users.filter((u: any) => {
        const roles = u.roles || [];
        const isStaffOrAdmin = roles.includes('STAFF') || roles.includes('ADMIN');

        if (activeTab === 'STAFF') return isStaffOrAdmin;
        return !isStaffOrAdmin; // Nếu là CUSTOMER thì không được chứa STAFF/ADMIN
    });

    // HÀM SỬA: Thay đổi quyền
    const handleRoleChange = (userId: string, currentName: string) => {
        if (userId === currentUser?._id) {
            Alert.alert('Từ chối', 'Bạn không thể tự thay đổi quyền của chính mình!');
            return;
        }

        Alert.alert(
            'Cấp quyền tài khoản',
            `Chọn vai trò mới cho: ${currentName}`,
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Khách hàng (Giáng chức)', onPress: () => updateRole(userId, 'CUSTOMER') },
                { text: 'Nhân viên (Staff)', onPress: () => updateRole(userId, 'STAFF') },
                { text: 'Quản trị viên (Admin)', onPress: () => updateRole(userId, 'ADMIN'), style: 'destructive' }
            ]
        );
    };

    const updateRole = async (userId: string, role: string) => {
        try {
            await changeUserRole(userId, role);
            Alert.alert('Thành công', `Đã cập nhật quyền thành: ${role}`);
        } catch (error: any) {
            Alert.alert('Lỗi', 'Không thể cập nhật quyền lúc này.');
        }
    };

    // HÀM XÓA: Xóa vĩnh viễn tài khoản
    const handleDelete = (userId: string, name: string) => {
        if (userId === currentUser?._id) {
            Alert.alert('Từ chối', 'Bạn không thể tự xóa chính mình!');
            return;
        }

        Alert.alert('Cảnh báo cực độ', `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${name}" không?`, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'XÓA',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteUser(userId);
                        Alert.alert('Thành công', 'Đã xóa tài khoản');
                    } catch (error) {
                        Alert.alert('Lỗi', 'Không thể xóa tài khoản này');
                    }
                }
            }
        ]);
    };

    // Giao diện 1 thẻ User
    const renderItem = ({ item }: { item: any }) => {
        const roles = item.roles || ['CUSTOMER'];
        const isAdmin = roles.includes('ADMIN');

        return (
            <View style={styles.card}>
                <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : 'U'}</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>{item.name || item.fullName || 'Người dùng ẩn danh'}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                    <View style={[styles.badge, { backgroundColor: isAdmin ? '#dc3545' : (activeTab === 'STAFF' ? '#ffc107' : '#28a745') }]}>
                        <Text style={styles.badgeText}>{isAdmin ? 'ADMIN' : (activeTab === 'STAFF' ? 'STAFF' : 'KHÁCH HÀNG')}</Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    {/* Nút Sửa Quyền */}
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleRoleChange(item._id, item.name || item.email)}>
                        <Ionicons name="shield-checkmark" size={22} color="#007bff" />
                    </TouchableOpacity>
                    {/* Nút Xóa */}
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item._id, item.name || item.email)}>
                        <Ionicons name="trash" size={22} color="#dc3545" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quản lý Người dùng</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* TABS CHUYỂN ĐỔI */}
            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, activeTab === 'STAFF' && styles.activeTab]} onPress={() => setActiveTab('STAFF')}>
                    <Text style={[styles.tabText, activeTab === 'STAFF' && styles.activeTabText]}>NHÂN SỰ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'CUSTOMER' && styles.activeTab]} onPress={() => setActiveTab('CUSTOMER')}>
                    <Text style={[styles.tabText, activeTab === 'CUSTOMER' && styles.activeTabText]}>KHÁCH HÀNG</Text>
                </TouchableOpacity>
            </View>

            {/* NÚT THÊM NHÂN VIÊN */}
            {activeTab === 'STAFF' && (
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AdminCreateUser')} // ĐÃ ĐỔI TÊN
                >
                    <Ionicons name="person-add" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.addButtonText}>TẠO TÀI KHOẢN MỚI</Text>
                </TouchableOpacity>
            )}

            {isLoading ? (
                <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 15 }}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>Không có dữ liệu</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#dc3545', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

    tabContainer: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#dc3545' },
    tabText: { fontSize: 16, fontWeight: 'bold', color: '#666' },
    activeTabText: { color: '#dc3545' },

    addButton: { backgroundColor: '#28a745', flexDirection: 'row', margin: 15, marginBottom: 0, padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginTop: 15, elevation: 2, alignItems: 'center' },
    avatarBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e6f2ff', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 22, fontWeight: 'bold', color: '#007bff' },
    info: { flex: 1, marginLeft: 15 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    email: { fontSize: 14, color: '#666', marginTop: 2, marginBottom: 5 },

    badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    actionRow: { flexDirection: 'row' },
    iconBtn: { padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8, marginLeft: 8 }
});