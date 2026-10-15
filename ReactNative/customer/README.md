# ShopTech Customer — React Native + Expo

Ứng dụng khách hàng. Mã nguồn và Android native được giữ nguyên từ dự án Expo nằm ở repository root trước khi sắp xếp.

Chạy từ thư mục gốc:

```bash
cd ReactNative/customer
npm ci
npm run start:customer
```

Thử Android: `npm run android:customer`.

Lưu ý cập nhật Root Directory của EAS/CI sang `ReactNative/customer` và kiểm tra URL API Backend trong `src/api/axiosClient.ts`. Không đè file native bằng cấu hình Shipper.
