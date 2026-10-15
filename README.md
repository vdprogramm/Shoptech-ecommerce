# ShopTech — Nền tảng thương mại điện tử đa nhà bán hàng

ShopTech gồm Backend NestJS/MongoDB, Web React/TanStack, Mobile React Native/Expo và AI FastAPI.

## Cấu trúc repository

| Đường dẫn | Vai trò |
| --- | --- |
| NodeJS/shoptech-backend/ | Backend NestJS, MongoDB, JWT, REST API, Socket.IO |
| WebAppSt/ | Frontend React Web (khách hàng, quản trị, nhà bán hàng) |
| ReactNative/customer/ | Ứng dụng Mobile Customer (Expo/Android) |
| ReactNative/shipper/ | Ứng dụng Mobile Shipper (Expo/Android) |
| ReactNative/apk/ | APK demo cũ, không dùng để biên dịch |
| NodeJS/shoptech-backend/src/shoptech-ai-service/ | AI FastAPI (giữ đường dẫn cũ để giảm rủi ro) |

Các thư mục Backend và Web giữ nguyên mã nguồn và đường dẫn cũ. Mobile được tách từ hai bản Android độc lập đã tồn tại, giữ nguyên cấu hình native của từng ứng dụng, không trộn lẫn hai bản. Bản refactor này chưa gộp hai ứng dụng Mobile vào chung một dự án Expo.

## Lệnh chạy (từ root repo)

Backend: `cd NodeJS/shoptech-backend && npm ci && npm run start:dev`

Web: `cd WebAppSt && npm ci && npm run dev`

Mobile Customer: `cd ReactNative/customer && npm ci && npm run start:customer`

Mobile Shipper: `cd ReactNative/shipper && npm ci && npm run start:shipper`

AI: vào `NodeJS/shoptech-backend/src/shoptech-ai-service`, cài `requirements.txt` và cấu hình MongoDB, mô hình AI/API keys phù hợp.

## Triển khai và xác minh

- Render Backend Root Directory: `NodeJS/shoptech-backend` (không đổi).
- Frontend Web Root Directory: `WebAppSt` (không đổi).
- **EAS/CI Mobile:** phải thay các build scripts cũ chạy ở repo root bằng `ReactNative/customer` hoặc `ReactNative/shipper` tương ứng.
- Cấu hình API URLs, MongoDB, AI và thanh toán trong môi trường chạy thật; không commit thông tin xác thực.
- Workflow GitHub Actions của pull request kiểm tra NestJS build, Web build và Expo config cho hai ứng dụng Mobile.

**Quan trọng:** Việc sắp xếp thư mục không tự chứng minh không còn lỗi runtime. Kiểm tra build, các luồng đặt hàng/thanh toán, AI, đăng nhập và Android trên máy thật trước khi merge vào master.

Xem hướng dẫn chi tiết trong từng thư mục Mobile.
