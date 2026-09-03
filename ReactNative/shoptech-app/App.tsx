import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { useAuthStore } from './src/store/authStore';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyOtpScreen from './src/screens/VerifyOtpScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import ShipperTabNavigator from './src/navigation/ShipperTabNavigator';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import AdminCreateProductScreen from './src/screens/Admin/AdminCreateProductScreen';
import AdminProductListScreen from './src/screens/Admin/AdminProductListScreen';
import AdminCategoryBrandScreen from './src/screens/Admin/AdminCategoryBrandScreen';
import AdminUserListScreen from './src/screens/Admin/AdminUserListScreen';
import AdminCreateUserScreen from './src/screens/Admin/AdminCreateUserScreen';
import MyOrdersScreen from './src/screens/MyOrdersScreen';
import AddressBookScreen from './src/screens/AddressBookScreen';
import AdminBannerScreen from './src/screens/Admin/AdminBannerScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import AddAddressScreen from './src/screens/AddAddressScreen';
import EditAddressScreen from './src/screens/EditAddressScreen';
import AdminDashboardScreen from './src/screens/Admin/AdminDashboardScreen';
import ChatAIScreen from './src/screens/ChatAIScreen';
import UtilityScreen from './src/screens/UtilityScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import StoresScreen from './src/screens/StoresScreen';
import StoreDetailScreen from './src/screens/StoreDetailScreen';
import AccountInfoScreen from './src/screens/AccountInfoScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import NewsScreen from './src/screens/NewsScreen';
import NewsDetailScreen from './src/screens/NewsDetailScreen';
import ShipperDeliveryScreen from './src/screens/Shipper/ShipperDeliveryScreen';
import HelpCenterScreen from './src/screens/HelpCenterScreen';
import WarrantyLookupScreen from './src/screens/WarrantyLookupScreen';
import ContactConsultationScreen from './src/screens/ContactConsultationScreen';
import VoucherScreen from './src/screens/VoucherScreen';
import FlashSaleScreen from './src/screens/FlashSaleScreen';
import PaymentWebViewScreen from './src/screens/PaymentWebViewScreen';
import PaymentResultScreen from './src/screens/PaymentResultScreen';
import OrderTrackingDriverScreen from './src/screens/OrderTrackingDriverScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const logout = useAuthStore((state) => state.logout);

  const appVariant = Constants.expoConfig?.extra?.variant || 'customer';
  const isShipperApp = appVariant === 'shipper';

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // Chặn user không phải shipper đăng nhập vào app Shipper
  if (token && isShipperApp && !user?.roles?.includes('SHIPPER')) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 }}>
        <Text style={{ fontSize: 18, color: 'red', textAlign: 'center', marginBottom: 20, fontWeight: 'bold' }}>
          Lỗi Truy Cập
        </Text>
        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
          Tài khoản của bạn không có quyền truy cập ứng dụng Tài Xế (Shipper). Vui lòng sử dụng ứng dụng Khách hàng.
        </Text>
        <Button title="Đăng xuất" onPress={logout} color="#007bff" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {token == null ? (
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              {!isShipperApp && (
                <>
                  <Stack.Screen name="Register" component={RegisterScreen} />
                  <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
                </>
              )}
            </>
          ) : (
            isShipperApp ? (
              <>
                <Stack.Screen name="ShipperTabs" component={ShipperTabNavigator} />
                <Stack.Screen name="ShipperDelivery" component={ShipperDeliveryScreen} />
                <Stack.Screen name="OrderTrackingDriver" component={OrderTrackingDriverScreen} />
                <Stack.Screen name="AccountInfo" component={AccountInfoScreen} />
                <Stack.Screen name="Notifications" component={NotificationScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
                <Stack.Screen name="AdminProductList" component={AdminProductListScreen} />
                <Stack.Screen name="AdminCreateProduct" component={AdminCreateProductScreen} />
                <Stack.Screen name="AdminCategoryBrand" component={AdminCategoryBrandScreen} />
                <Stack.Screen name="AdminUserList" component={AdminUserListScreen} />
                <Stack.Screen name="AdminCreateUser" component={AdminCreateUserScreen} />
                <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
                <Stack.Screen name="AddressBook" component={AddressBookScreen} />
                <Stack.Screen name="AdminBanner" component={AdminBannerScreen} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
                <Stack.Screen name="AddAddress" component={AddAddressScreen} />
                <Stack.Screen name="EditAddress" component={EditAddressScreen} />
                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                <Stack.Screen name="ChatAI" component={ChatAIScreen} />
                <Stack.Screen name="Utility" component={UtilityScreen} />
                <Stack.Screen name="Wishlist" component={WishlistScreen} />
                <Stack.Screen name="Notifications" component={NotificationScreen} />
                <Stack.Screen name="Stores" component={StoresScreen} />
                <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
                <Stack.Screen name="AccountInfo" component={AccountInfoScreen} />
                <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
                <Stack.Screen name="News" component={NewsScreen} />
                <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
                <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
                <Stack.Screen name="WarrantyLookup" component={WarrantyLookupScreen} />
                <Stack.Screen name="ContactConsultation" component={ContactConsultationScreen} />
                <Stack.Screen name="Vouchers" component={VoucherScreen} />
                <Stack.Screen name="FlashSale" component={FlashSaleScreen} />
                <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
                <Stack.Screen name="PaymentResult" component={PaymentResultScreen} />
              </>
            )
          )}
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}