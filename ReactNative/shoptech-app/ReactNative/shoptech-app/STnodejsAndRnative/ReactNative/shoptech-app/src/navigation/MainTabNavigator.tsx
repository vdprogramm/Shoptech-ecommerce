import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import ChatAIScreen from '../screens/ChatAIScreen'; // Đảm bảo đã import màn hình chat
import { useCartStore } from '../store/cartStore';
import UtilityScreen from '../screens/UtilityScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ProfileStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="ProfileMain"
                component={ProfileScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboardScreen}
                options={{ title: 'Thống kê doanh thu' }}
            />
        </Stack.Navigator>
    );
}

export default function MainTabNavigator() {
    const cartCount = useCartStore((state) => state.items.length);
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any;

                    if (route.name === 'HomeTab') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'SearchTab') {
                        iconName = focused ? 'search' : 'search-outline';
                    } else if (route.name === 'AITab') { // Thêm logic icon cho AI
                        iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
                    } else if (route.name === 'CartTab') {
                        iconName = focused ? 'cart' : 'cart-outline';
                    } else if (route.name === 'ProfileTab') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#cb1c22',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
                tabBarStyle: { 
                    paddingBottom: Math.max(insets.bottom, 10), 
                    paddingTop: 5, 
                    height: 60 + Math.max(insets.bottom, 0) 
                }
            })}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Trang chủ' }} />
            <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: 'Tìm kiếm' }} />
            <Tab.Screen
                name="UtilityTab"
                component={UtilityScreen}
                options={{
                    title: 'Tiện ích',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="grid-outline" size={24} color={color} />
                    ),
                }}
            />

            {/* Thêm Tab AI vào giữa hoặc vị trí bạn muốn */}
            <Tab.Screen
                name="AITab"
                component={ChatAIScreen}
                options={{ title: 'Trợ lý AI' }}
            />

            <Tab.Screen
                name="CartTab"
                component={CartScreen}
                options={{
                    title: 'Giỏ hàng',
                    tabBarBadge: cartCount > 0 ? cartCount : undefined
                }}
            />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Hồ sơ' }} />
        </Tab.Navigator>
    );
}