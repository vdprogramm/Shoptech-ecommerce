import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import các màn hình tab chính
import ShipperHomeScreen from '../screens/Shipper/ShipperHomeScreen';
import ShipperEarningsScreen from '../screens/Shipper/ShipperEarningsScreen';
import ShipperServicesScreen from '../screens/Shipper/ShipperServicesScreen';
import ShipperInboxScreen from '../screens/Shipper/ShipperInboxScreen';
import ProfileScreen from '../screens/ProfileScreen';

import PendingOrdersScreen from '../screens/Shipper/PendingOrdersScreen';
import TripHistoryScreen from '../screens/Shipper/TripHistoryScreen';
import { ShipperPersonalInfoScreen } from '../screens/Shipper/ShipperPersonalInfoScreen';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

// 1. TẠO STACK RIÊNG CHO TAB "TÔI"
function ProfileStackNavigator() {
    return (
        <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
            <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
            <ProfileStack.Screen name="PendingOrders" component={PendingOrdersScreen} />
            <ProfileStack.Screen name="TripHistory" component={TripHistoryScreen} />
            <ProfileStack.Screen name="ShipperPersonalInfo" component={ShipperPersonalInfoScreen} />
        </ProfileStack.Navigator>
    );
}

// 2. KHAI BÁO TAB NAVIGATOR CHÍNH
export default function ShipperTabNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any;

                    if (route.name === 'ShipperHomeTab') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'EarningsTab') iconName = focused ? 'wallet' : 'wallet-outline';
                    else if (route.name === 'ServicesTab') iconName = focused ? 'grid' : 'grid-outline';
                    else if (route.name === 'InboxTab') iconName = focused ? 'mail' : 'mail-outline';
                    else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#ff4757',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
                tabBarStyle: { 
                    paddingBottom: Math.max(insets.bottom, 10), 
                    paddingTop: 5, 
                    height: 60 + Math.max(insets.bottom, 0), 
                    backgroundColor: '#1a1a1a',
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8
                }
            })}
        >
            <Tab.Screen name="ShipperHomeTab" component={ShipperHomeScreen} options={{ title: 'Trang chủ' }} />
            <Tab.Screen name="EarningsTab" component={ShipperEarningsScreen} options={{ title: 'Thu nhập' }} />
            <Tab.Screen name="ServicesTab" component={ShipperServicesScreen} options={{ title: 'Dịch vụ' }} />
            <Tab.Screen name="InboxTab" component={ShipperInboxScreen} options={{ title: 'Hộp thư' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Tôi' }} />
        </Tab.Navigator>
    );
}