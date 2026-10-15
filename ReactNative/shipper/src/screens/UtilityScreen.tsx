import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, StatusBar, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Cấu trúc dữ liệu cho các mục tiện ích
const UTILITY_DATA = [
    {
        title: 'Tính năng chung',
        data: [
            { icon: 'newspaper-variant-outline', label: 'Tin tức', color: '#1e88e5', route: 'News' },
            { icon: 'storefront-outline', label: 'Cửa hàng', color: '#cb1c22', route: 'Stores' },
        ]
    },
    {
        title: 'Bảo hành - Hỗ trợ',
        data: [
            { icon: 'help-circle-outline', label: 'Trung tâm trợ giúp', color: '#cb1c22', route: 'HelpCenter' },
            { icon: 'shield-check-outline', label: 'Tra cứu bảo hành', color: '#333', route: 'WarrantyLookup' },
            { icon: 'chat-processing-outline', label: 'Chat AI trực tuyến', color: '#333', route: 'ChatAI' },
        ]
    }
];

export default function UtilityScreen() {
    const navigation = useNavigation<any>();

    // Thêm tab 'Tất cả' vào đầu danh sách
    const tabs = ['Tất cả', ...UTILITY_DATA.map(group => group.title)];
    const [activeTab, setActiveTab] = useState('Tất cả');

    // Lọc dữ liệu dựa trên tab đang chọn
    const displayedData = activeTab === 'Tất cả'
        ? UTILITY_DATA
        : UTILITY_DATA.filter(group => group.title === activeTab);

    const renderItem = (item: any, index: number) => (
        <TouchableOpacity
            key={index}
            style={styles.gridItem}
            onPress={() => item.route && navigation.navigate(item.route)}
            activeOpacity={item.route ? 0.7 : 1}
        >
            <View style={[styles.iconBox, item.route && styles.iconBoxActive]}>
                <MaterialCommunityIcons name={item.icon} size={28} color={item.color || '#333'} />
            </View>
            <Text style={styles.itemLabel} numberOfLines={2}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor="#cb1c22" />

            {/* Header phong cách FPT Shop */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tiện ích ShopTech</Text>
                <View style={styles.searchRow}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#888" />
                        <TextInput
                            placeholder="Tìm kiếm tiện ích..."
                            placeholderTextColor="#999"
                            style={styles.searchInput}
                        />
                    </View>
                    <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
                        <Ionicons name="notifications-outline" size={24} color="#fff" />
                        <View style={styles.notifBadge} />
                    </TouchableOpacity>
                </View>

                {/* Thanh Tabs phân loại */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabContainer}
                    contentContainerStyle={{ paddingRight: 20 }}
                >
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.container}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    {displayedData.map((group, gIndex) => (
                        <View key={gIndex} style={styles.section}>
                            <Text style={styles.sectionTitle}>{group.title}</Text>
                            <View style={styles.grid}>
                                {group.data.map((item, iIndex) => renderItem(item, iIndex))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#cb1c22' }, // Màu đỏ đặc trưng
    container: { flex: 1, backgroundColor: '#f4f6f8' },

    header: {
        backgroundColor: '#cb1c22',
        paddingTop: 10,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginLeft: 15,
        marginBottom: 15,
        color: '#fff'
    },
    searchRow: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        alignItems: 'center',
        marginBottom: 15
    },
    searchBar: {
        flex: 1,
        backgroundColor: '#fff',
        height: 42,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        marginRight: 12
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        marginLeft: 8,
        color: '#333'
    },
    notifBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    notifBadge: {
        position: 'absolute',
        top: 8,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ffc107',
        borderWidth: 1,
        borderColor: '#cb1c22'
    },

    // Tabs
    tabContainer: {
        paddingLeft: 15
    },
    tabItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'transparent'
    },
    tabItemActive: {
        backgroundColor: '#fff',
        borderColor: '#fff'
    },
    tabText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500'
    },
    tabTextActive: {
        color: '#cb1c22',
        fontWeight: 'bold'
    },

    // Content
    content: { padding: 15 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#333', paddingLeft: 5 },

    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 15,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5
    },
    gridItem: {
        width: '25%',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5
    },
    iconBox: {
        marginBottom: 8,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center'
    },
    iconBoxActive: {
        backgroundColor: '#fce8e8',
        borderRadius: 12
    },
    itemLabel: {
        fontSize: 11,
        textAlign: 'center',
        color: '#444',
        lineHeight: 16
    }
});