import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAddressStore } from '../store/addressStore';
import CustomAlert from '../components/CustomAlert';
import axios from 'axios';

// Interfaces for API response
interface LocationItem {
    code: number;
    name: string;
}

export default function AddAddressScreen() {
    const navigation = useNavigation();
    const { addAddress } = useAddressStore();

    // Form states
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [street, setStreet] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    // Location states
    const [provinces, setProvinces] = useState<LocationItem[]>([]);
    const [districts, setDistricts] = useState<LocationItem[]>([]);
    const [wards, setWards] = useState<LocationItem[]>([]);

    const [selectedProvince, setSelectedProvince] = useState<LocationItem | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<LocationItem | null>(null);
    const [selectedWard, setSelectedWard] = useState<LocationItem | null>(null);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'province' | 'district' | 'ward' | null>(null);
    const [modalData, setModalData] = useState<LocationItem[]>([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);

    // Alert state
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'warning' | 'info',
        onClose: () => {}
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info', onClose?: () => void) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            onClose: () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                if (onClose) onClose();
            }
        });
    };

    useEffect(() => {
        fetchProvinces();
    }, []);

    const fetchProvinces = async () => {
        try {
            const res = await axios.get('https://provinces.open-api.vn/api/p/');
            setProvinces(res.data);
        } catch (error) {
            console.error('Fetch provinces error', error);
        }
    };

    const fetchDistricts = async (provinceCode: number) => {
        try {
            setIsLoadingLocations(true);
            const res = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
            setDistricts(res.data.districts || []);
            setIsLoadingLocations(false);
        } catch (error) {
            console.error('Fetch districts error', error);
            setIsLoadingLocations(false);
        }
    };

    const fetchWards = async (districtCode: number) => {
        try {
            setIsLoadingLocations(true);
            const res = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
            setWards(res.data.wards || []);
            setIsLoadingLocations(false);
        } catch (error) {
            console.error('Fetch wards error', error);
            setIsLoadingLocations(false);
        }
    };

    const openModal = (type: 'province' | 'district' | 'ward') => {
        if (type === 'district' && !selectedProvince) {
            showAlert('Lỗi', 'Vui lòng chọn Tỉnh / Thành phố trước', 'warning');
            return;
        }
        if (type === 'ward' && !selectedDistrict) {
            showAlert('Lỗi', 'Vui lòng chọn Quận / Huyện trước', 'warning');
            return;
        }
        setModalType(type);
        if (type === 'province') setModalData(provinces);
        if (type === 'district') setModalData(districts);
        if (type === 'ward') setModalData(wards);
        setModalVisible(true);
    };

    const handleSelectItem = (item: LocationItem) => {
        if (modalType === 'province') {
            setSelectedProvince(item);
            setSelectedDistrict(null);
            setSelectedWard(null);
            setDistricts([]);
            setWards([]);
            fetchDistricts(item.code);
        } else if (modalType === 'district') {
            setSelectedDistrict(item);
            setSelectedWard(null);
            setWards([]);
            fetchWards(item.code);
        } else if (modalType === 'ward') {
            setSelectedWard(item);
        }
        setModalVisible(false);
    };

    const handleSave = async () => {
        if (!name || !phone || !selectedProvince || !selectedDistrict || !selectedWard || !street) {
            showAlert('Lỗi', 'Vui lòng điền đầy đủ các trường có dấu (*)', 'error');
            return;
        }

        const newAddress = {
            receiverName: name,
            phone: phone,
            province: selectedProvince.name,
            district: selectedDistrict.name,
            ward: selectedWard.name,
            street: street,
            isDefault: isDefault
        };

        const isSuccess = await addAddress(newAddress);

        if (isSuccess) {
            showAlert('Thành công', 'Đã thêm địa chỉ giao hàng mới!', 'success', () => {
                navigation.goBack();
            });
        } else {
            showAlert('Lỗi', 'Không thể thêm địa chỉ. Vui lòng kiểm tra lại!', 'error');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>THÊM ĐỊA CHỈ MỚI</Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tên người nhận (*)</Text>
                    <TextInput style={styles.input} placeholder="Nhập họ và tên" value={name} onChangeText={setName} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Số điện thoại (*)</Text>
                    <TextInput style={styles.input} placeholder="Nhập số điện thoại" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tỉnh / Thành phố (*)</Text>
                    <TouchableOpacity style={styles.selectBox} onPress={() => openModal('province')}>
                        <Text style={[styles.selectText, !selectedProvince && { color: '#999' }]}>
                            {selectedProvince ? selectedProvince.name : 'Chọn Tỉnh / Thành phố'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Quận / Huyện (*)</Text>
                    <TouchableOpacity style={styles.selectBox} onPress={() => openModal('district')}>
                        <Text style={[styles.selectText, !selectedDistrict && { color: '#999' }]}>
                            {selectedDistrict ? selectedDistrict.name : 'Chọn Quận / Huyện'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phường / Xã (*)</Text>
                    <TouchableOpacity style={styles.selectBox} onPress={() => openModal('ward')}>
                        <Text style={[styles.selectText, !selectedWard && { color: '#999' }]}>
                            {selectedWard ? selectedWard.name : 'Chọn Phường / Xã'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Địa chỉ cụ thể (Số nhà, tên đường) (*)</Text>
                    <TextInput style={styles.input} placeholder="VD: Số 123 Đường Xuân Thủy" value={street} onChangeText={setStreet} />
                </View>

                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Đặt làm địa chỉ mặc định</Text>
                    <Switch
                        value={isDefault}
                        onValueChange={setIsDefault}
                        trackColor={{ false: '#d1d5db', true: '#cb1c22' }}
                        thumbColor={isDefault ? '#fff' : '#f4f3f4'}
                    />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>LƯU ĐỊA CHỈ</Text>
                </TouchableOpacity>
                
                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {modalType === 'province' ? 'Chọn Tỉnh / Thành phố' : modalType === 'district' ? 'Chọn Quận / Huyện' : 'Chọn Phường / Xã'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        {isLoadingLocations ? (
                            <ActivityIndicator size="large" color="#cb1c22" style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={modalData}
                                keyExtractor={(item) => item.code.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectItem(item)}>
                                        <Text style={styles.modalItemText}>{item.name}</Text>
                                        {(modalType === 'province' && selectedProvince?.code === item.code) ||
                                         (modalType === 'district' && selectedDistrict?.code === item.code) ||
                                         (modalType === 'ward' && selectedWard?.code === item.code) ? (
                                            <Ionicons name="checkmark" size={20} color="#cb1c22" />
                                         ) : null}
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
            
            <CustomAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={alertConfig.onClose}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { 
        backgroundColor: '#cb1c22', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 15
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    formContainer: { padding: 15, backgroundColor: '#fff', marginTop: 10 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: { 
        borderWidth: 1, 
        borderColor: '#d1d5db', 
        borderRadius: 8, 
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 15, 
        backgroundColor: '#fff',
        color: '#111827'
    },
    selectBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1, 
        borderColor: '#d1d5db', 
        borderRadius: 8, 
        paddingHorizontal: 15,
        paddingVertical: 14,
        backgroundColor: '#fff',
    },
    selectText: {
        fontSize: 15,
        color: '#111827'
    },
    switchRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 10,
        marginBottom: 20, 
        paddingVertical: 15, 
        borderTopWidth: 1, 
        borderColor: '#f3f4f6' 
    },
    switchLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
    saveBtn: { 
        backgroundColor: '#cb1c22', 
        paddingVertical: 15, 
        borderRadius: 8, 
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#cb1c22',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '80%',
        minHeight: '50%',
        paddingBottom: 20
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#f3f4f6'
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827'
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderColor: '#f3f4f6'
    },
    modalItemText: {
        fontSize: 15,
        color: '#374151'
    }
});