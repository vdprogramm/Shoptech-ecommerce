# 📱 Hướng Dẫn Cài Đặt & Chạy ShopTech App

## 🚀 APK Build Information

| App | Package ID | Phiên Bản | Kích Thước | Vị Trí |
|-----|-----------|-----------|-----------|--------|
| **Customer** | com.shoptech.app | Debug | 144.27 MB | `APK_Backups/app-customer-debug.apk` |
| **Shipper** | com.shoptech.shipper | Debug | 144.27 MB | `APK_Backups/app-shipper-debug.apk` |

---

## 📥 Cách Cài Đặt APK

### Cách 1: Dùng USB Cable + ADB
```bash
# Kết nối thiết bị Android via USB
# Bật Developer Mode: Settings > About Phone > Tap Build Number 7 lần
# Enable USB Debugging

# Cài đặt Customer App
adb install APK_Backups/app-customer-debug.apk

# Cài đặt Shipper App
adb install APK_Backups/app-shipper-debug.apk

# Xem danh sách app
adb shell pm list packages | grep shoptech
```

### Cách 2: Drag & Drop vào Emulator
1. Mở Android Emulator
2. Drag file APK vào cửa sổ emulator
3. Chờ cài đặt xong

### Cách 3: Transfer File + Tap Trực Tiếp
1. Copy APK vào USB hoặc Google Drive
2. Download trên thiết bị Android
3. Tap file để cài đặt

---

## 🧪 Chạy & Test App

### Startup Test
```bash
# Kiểm tra app đã cài đặt
adb shell dumpsys package | grep shoptech

# Xóa cache nếu gặp lỗi
adb shell pm clear com.shoptech.app
adb shell pm clear com.shoptech.shipper

# Khởi động app
adb shell am start -n com.shoptech.app/.MainActivity
adb shell am start -n com.shoptech.shipper/.MainActivity
```

### Chức Năng Cần Test
- [ ] **Customer App**: Đăng nhập, xem sản phẩm, thêm vào giỏ, checkout
- [ ] **Shipper App**: Đăng nhập, xem đơn hàng, tracking
- [ ] **Navigation**: Tab menu hoạt động bình thường
- [ ] **Network**: API calls không bị error
- [ ] **Storage**: Lưu data cục bộ (cart, wishlist, etc.)

---

## 🔧 Các Biến Môi Trường Quan Trọng

```bash
# Build Customer App
APP_VARIANT=customer npm run android:customer

# Build Shipper App
APP_VARIANT=shipper npm run android:shipper

# Build Release
APP_VARIANT=customer npm run build:customer:release
APP_VARIANT=shipper npm run build:shipper:release
```

---

## 🐛 Nếu Gặp Lỗi

### "App not installed"
- Thiết bị phải hỗ trợ target SDK 36 (Android 14+)
- Check storage: `adb shell df /data`
- Clear cache: `adb shell pm clear com.shoptech.app`

### "Cannot connect to API"
- Kiểm tra backend URL trong `.env` hoặc `app.config.js`
- Thiết bị phải connect được Internet
- Test: `adb shell ping 8.8.8.8`

### "Gradle Error" khi build
```bash
cd android
./gradlew clean
./gradlew :app:assembleCustomerDebug -x lint
```

---

## 📋 Project Structure

```
shoptech-app/
├── android/
│   ├── app/build/outputs/apk/
│   │   ├── customer/debug/app-customer-debug.apk
│   │   └── shipper/debug/app-shipper-debug.apk
│   └── build.gradle (productFlavors config)
├── APK_Backups/          # Backup safe folder
├── app.config.js         # Biến variant environment
├── react-native.config.js
└── package.json
```

---

## 🎯 Demo Preparation Checklist

- [ ] APK files ready ✅
- [ ] Backup folder created ✅
- [ ] Test device prepared (emulator or physical)
- [ ] Network/API server running
- [ ] Demo credentials prepared
- [ ] Screenshots/video guides ready
- [ ] Presentation slides with app features

---

## 📞 Quick Commands

```bash
# List all APK files
Get-ChildItem -Path . -Recurse -Filter *.apk

# Check APK size
(Get-Item "APK_Backups/app-customer-debug.apk").Length / 1MB

# Copy for backup
Copy-Item -Path "android/app/build/outputs/apk/customer/debug/*.apk" -Destination "APK_Backups/" -Recurse

# Monitor build logs
adb logcat | grep shoptech
```

---

## ✨ Build Details

- **Expo Version**: ~54.0.33
- **React Native**: 0.81.5
- **Gradle**: 8.14.3
- **Android SDK**: 36 (target + compile)
- **Min SDK**: 24 (Android 7.0)
- **NDK**: 27.1.12297006
- **New Architecture**: Disabled (stable legacy mode)

---

**Ngày build**: 2026-09-01 | **Status**: ✅ Ready for Demo
