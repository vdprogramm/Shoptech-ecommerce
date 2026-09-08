import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import React from "react";

import { redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthUser } from "@/types/auth";

// 🌟 ĐĂNG KÝ LAYOUT ROUTE: Đồng bộ chính xác vị trí file trong thư mục _site
export const Route = createFileRoute("/_site/merchant")({
  beforeLoad: async ({ location }) => {
    const userStorage = localStorage.getItem("user");

    if (!userStorage) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    const user: AuthUser = JSON.parse(userStorage);
    const isMerchant = user.roles?.some((role) => role === "STORE_OWNER" || role === "STORE_STAFF");

    if (!isMerchant) {
      toast.error("Bạn không có quyền truy cập vào kênh người bán!");
      throw redirect({ to: "/" });
    }
  },
  component: MerchantLayout,
});

function MerchantLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-5 text-xl font-bold border-b border-slate-800 text-red-500 flex items-center gap-2">
          ShopTech Merchant
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/merchant/dashboard"
            className="block px-4 py-2.5 rounded hover:bg-slate-800 transition text-gray-300 [&.active]:bg-red-600 [&.active]:text-white [&.active]:font-medium"
          >
            📊 Tổng quan cửa hàng
          </Link>

          {/* ✨ MỚI: Thêm link Quản lý đơn hàng */}
          <Link
            to="/merchant/orders"
            className="block px-4 py-2.5 rounded hover:bg-slate-800 transition text-gray-300 [&.active]:bg-red-600 [&.active]:text-white [&.active]:font-medium"
          >
            🛒 Quản lý đơn hàng
          </Link>

          <Link
            to="/merchant/products"
            className="block px-4 py-2.5 rounded hover:bg-slate-800 transition text-gray-300 [&.active]:bg-red-600 [&.active]:text-white [&.active]:font-medium"
          >
            📦 Quản lý sản phẩm
          </Link>

          <Link
            to="/merchant/inventory"
            className="block px-4 py-2.5 rounded hover:bg-slate-800 transition text-gray-300 [&.active]:bg-red-600 [&.active]:text-white [&.active]:font-medium"
          >
            📥 Quản lý nhập kho
          </Link>

          <Link
            to="/merchant/categories"
            className="block px-4 py-2.5 rounded hover:bg-slate-800 transition text-gray-300 [&.active]:bg-red-600 [&.active]:text-white [&.active]:font-medium"
          >
            📂 Danh mục sản phẩm
          </Link>

          <Link
            to="/merchant/brands"
            className="block px-4 py-2.5 rounded hover:bg-slate-800 transition text-gray-300 [&.active]:bg-red-600 [&.active]:text-white [&.active]:font-medium"
          >
            🏷️ Thương hiệu
          </Link>

          <Link
            to="/merchant/staff"
            className="block px-4 py-2.5 rounded hover:bg-slate-800 transition text-gray-300 [&.active]:bg-red-600 [&.active]:text-white [&.active]:font-medium"
          >
            👥 Quản lý nhân viên
          </Link>

          <Link
            to="/merchant/warranties"
            className="block px-4 py-2.5 rounded hover:bg-slate-800 transition text-gray-300 [&.active]:bg-red-600 [&.active]:text-white [&.active]:font-medium"
          >
            🛡️ Quản lý bảo hành
          </Link>

          <Link
            to="/merchant/flash-sales"
            className="block px-4 py-2.5 rounded hover:bg-slate-800 transition text-gray-300 [&.active]:bg-red-600 [&.active]:text-white [&.active]:font-medium"
          >
            ⚡ Quản lý Flash Sale
          </Link>

          <Link
            to="/merchant/vouchers"
            className="block px-4 py-2.5 rounded hover:bg-slate-800 transition text-gray-300 [&.active]:bg-red-600 [&.active]:text-white [&.active]:font-medium"
          >
            🎟️ Quản lý Voucher
          </Link>
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-slate-800 rounded transition flex items-center gap-2"
          >
            ↩️ Đăng xuất
          </button>
        </div>
      </div>

      {/* VÙNG HIỂN THỊ NỘI DUNG CHÍNH CỦA CÁC TRANG CON */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </div>
    </div>
  );
}
