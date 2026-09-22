import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { DataTable } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

export default function AdminDashboardScreen() {
    const navigation = useNavigation();

    // Dữ liệu biểu đồ (giữ nguyên như cũ)
    const lineData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            data: [20, 45, 28, 80, 99, 43],
            color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
            strokeWidth: 2
        }],
        legend: ["Doanh thu"]
    };

    const barData = {
        labels: ['iPhone', 'Laptop', 'Watch', 'iPad'],
        datasets: [{ data: [50, 20, 15, 30] }]
    };

    const pieData = [
        { name: 'Apple', population: 40, color: '#f44336', legendFontColor: '#7F7F7F', legendFontSize: 12 },
        { name: 'Samsung', population: 25, color: '#2196F3', legendFontColor: '#7F7F7F', legendFontSize: 12 },
        { name: 'Dell', population: 20, color: '#4CAF50', legendFontColor: '#7F7F7F', legendFontSize: 12 },
        { name: 'Khác', population: 15, color: '#FFEB3B', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    ];

    const chartConfig = {
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: { borderRadius: 16 },
    };

    return (
        <ScrollView style={styles.container}>

            <Text style={styles.headerTitle}>Báo Cáo Hoạt Động</Text>

            <View style={styles.card}>
                <Text style={styles.chartTitle}>Tăng trưởng doanh thu</Text>
                <LineChart
                    data={lineData}
                    width={screenWidth - 40}
                    height={200}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chartStyle}
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.chartTitle}>Sản phẩm bán chạy</Text>
                <BarChart
                    data={barData}
                    width={screenWidth - 40}
                    height={200}
                    chartConfig={chartConfig}
                    yAxisLabel=""
                    yAxisSuffix=""
                    style={styles.chartStyle}
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.chartTitle}>Thị phần thương hiệu</Text>
                <PieChart
                    data={pieData}
                    width={screenWidth - 40}
                    height={180}
                    chartConfig={chartConfig}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    absolute
                />
            </View>

            <View style={[styles.card, { marginBottom: 40 }]}>
                <DataTable>
                    <DataTable.Header>
                        <DataTable.Title>Khách hàng</DataTable.Title>
                        <DataTable.Title numeric>Giá trị</DataTable.Title>
                    </DataTable.Header>
                    <DataTable.Row>
                        <DataTable.Cell>Vinh Đình</DataTable.Cell>
                        <DataTable.Cell numeric>35tr</DataTable.Cell>
                    </DataTable.Row>
                </DataTable>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
    // THÊM CÁC STYLE CÒN THIẾU VÀO ĐÂY
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10
    },
    backText: {
        fontSize: 16,
        color: '#007bff',
        fontWeight: '600',
        marginLeft: 5
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    chartTitle: { fontSize: 15, fontWeight: 'bold', color: '#666', marginBottom: 10 },
    chartStyle: { marginVertical: 8, borderRadius: 16 }
});