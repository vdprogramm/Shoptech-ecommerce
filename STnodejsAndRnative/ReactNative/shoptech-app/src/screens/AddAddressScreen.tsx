import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAddressStore } from '../store/addressStore';

export default function AddAddressScreen() {
    const navigation = useNavigation();
    const { addAddress } = useAddressStore();

    // Các State lưu trữ thông tin nhập vào
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [street, setStreet] = useState('');
    const [ward, setWard] = useState('');
    const [district, setDistrict] = useState('');
    const [city, setCity] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    const handleSave = async () => {
        // Validate sương sương
        if (!name || !phone || !street || !city) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường có dấu (*)');
            return;
        }

        const newAddress = {
            receiverName: name,
            phone: phone,
            province: city,
            district: district,
            ward: ward,
            street: street,
            isDefault: isDefault
        };

        const isSuccess = await addAddress(newAddress);

        if (isSuccess) {
            Alert.alert('Thành công', 'Đã thêm địa chỉ giao hàng mới!');
            navigation.goBack(); // Thêm xong tự động quay lại trang trước
        } else {
            Alert.alert('Lỗi', 'Không thể thêm địa chỉ. Vui lòng kiểm tra lại!');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thêm Địa Chỉ Mới</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.formContainer}>
                <Text style={styles.label}>Tên người nhận (*)</Text>
                <TextInput style={styles.input} placeholder="VD: Nguyễn Văn A" value={name} onChangeText={setName} />

                <Text style={styles.label}>Số điện thoại (*)</Text>
                <TextInput style={styles.input} placeholder="VD: 0987654321" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

                <Text style={styles.label}>Tỉnh / Thành phố (*)</Text>
                <TextInput style={styles.input} placeholder="VD: Hà Nội" value={city} onChangeText={setCity} />

                <Text style={styles.label}>Quận / Huyện</Text>
                <TextInput style={styles.input} placeholder="VD: Cầu Giấy" value={district} onChangeText={setDistrict} />

                <Text style={styles.label}>Phường / Xã</Text>
                <TextInput style={styles.input} placeholder="VD: Dịch Vọng" value={ward} onChangeText={setWard} />

                <Text style={styles.label}>Địa chỉ cụ thể (Số nhà, tên đường) (*)</Text>
                <TextInput style={styles.input} placeholder="VD: Số 123 Đường Xuân Thủy" value={street} onChangeText={setStreet} />

                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Đặt làm địa chỉ mặc định</Text>
                    <Switch
                        value={isDefault}
                        onValueChange={setIsDefault}
                        trackColor={{ false: '#767577', true: '#28a745' }}
                        thumbColor={isDefault ? '#fff' : '#f4f3f4'}
                    />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>LƯU ĐỊA CHỈ</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4' },
    header: { backgroundColor: '#28a745', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    formContainer: { padding: 20, backgroundColor: '#fff', marginTop: 10 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 15, backgroundColor: '#f9f9f9' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15, paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
    switchLabel: { fontSize: 16, color: '#333', fontWeight: '500' },
    saveBtn: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});