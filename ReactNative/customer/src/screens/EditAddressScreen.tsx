import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAddressStore } from '../store/addressStore';

export default function EditAddressScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { updateAddress } = useAddressStore();

    // Lấy gói dữ liệu address truyền từ AddressBookScreen sang
    const { address } = route.params;

    // Đổ dữ liệu cũ vào form
    const [name, setName] = useState(address.receiverName || address.name || '');
    const [phone, setPhone] = useState(address.phone || '');
    const [street, setStreet] = useState(address.street || '');
    const [ward, setWard] = useState(address.ward || '');
    const [district, setDistrict] = useState(address.district || '');
    const [city, setCity] = useState(address.province || address.city || '');
    const [isDefault, setIsDefault] = useState(address.isDefault || false);

    const handleUpdate = async () => {
        if (!name || !phone || !street || !city) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }

        const updatedData = {
            receiverName: name,
            phone,
            province: city,
            district,
            ward,
            street,
            isDefault
        };

        const isSuccess = await updateAddress(address._id || address.id, updatedData);

        if (isSuccess) {
            Alert.alert('Thành công', 'Đã cập nhật địa chỉ!');
            navigation.goBack();
        } else {
            Alert.alert('Lỗi', 'Không thể cập nhật. Vui lòng thử lại.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cập nhật Địa Chỉ</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.formContainer}>
                {/* Form giống y hệt AddAddressScreen */}
                <Text style={styles.label}>Tên người nhận (*)</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} />

                <Text style={styles.label}>Số điện thoại (*)</Text>
                <TextInput style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

                <Text style={styles.label}>Tỉnh / Thành phố (*)</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} />

                <Text style={styles.label}>Quận / Huyện</Text>
                <TextInput style={styles.input} value={district} onChangeText={setDistrict} />

                <Text style={styles.label}>Phường / Xã</Text>
                <TextInput style={styles.input} value={ward} onChangeText={setWard} />

                <Text style={styles.label}>Địa chỉ cụ thể (*)</Text>
                <TextInput style={styles.input} value={street} onChangeText={setStreet} />

                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Đặt làm địa chỉ mặc định</Text>
                    <Switch value={isDefault} onValueChange={setIsDefault} />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                    <Text style={styles.saveBtnText}>LƯU THAY ĐỔI</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

// Styles giống hệt AddAddressScreen, bạn copy styles từ bên đó qua nhé:
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4' },
    header: { backgroundColor: '#007bff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    formContainer: { padding: 20, backgroundColor: '#fff', marginTop: 10 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 15, backgroundColor: '#f9f9f9' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15, paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
    switchLabel: { fontSize: 16, color: '#333', fontWeight: '500' },
    saveBtn: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});