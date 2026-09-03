import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { User, Package, Heart, Bell, MapPin, LogOut, UserCircle } from "lucide-react";
import { useState, useEffect } from "react";
// 🔴 IMPORT DỊCH VỤ API AUTH TẬP TRUNG
import { authService } from "@/lib/api/api-auth";

const menu = [
  { to: "/account", label: "Thông tin cá nhân", icon: User, exact: true },
  { to: "/account/orders", label: "Đơn hàng của tôi", icon: Package },
  { to: "/account/wishlist", label: "Sản phẩm yêu thích", icon: Heart },
  { to: "/account/notifications", label: "Thông báo", icon: Bell },
  { to: "/account/addresses", label: "Sổ địa chỉ", icon: MapPin },
];

export const Route = createFileRoute("/_site/account")({
  component: AccountLayout,
});

function AccountLayout() {
  // 🔴 QUẢN LÝ TRẠNG THÁI THÔNG TIN NGƯỜI DÙNG ĐĂNG NHẬP
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authCheck = authService.isAuthenticated();
      setIsLoggedIn(authCheck);
      if (authCheck) {
        setCurrentUser(authService.getCurrentUser());
      } else {
        setCurrentUser(null);
      }
    };

    // Kiểm tra ngay khi nạp giao diện sidebar
    checkAuth();

    // Đồng bộ hóa dữ liệu thời gian thực
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    // Gọi hàm logout xóa localStorage và điều hướng về trang đăng nhập
    authService.logout();
  };

  return (
    <div className="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
      {/* Sidebar điều hướng bên trái */}
      <aside className="rounded-xl bg-card p-3 shadow-[var(--shadow-card)] h-fit border">
        {/* Khối thông tin User Header Động */}
        <div className="px-3 py-3 border-b mb-2 flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <div className="h-10 w-10 overflow-hidden rounded-full bg-muted flex items-center justify-center shrink-0 border border-primary/20">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs text-card-foreground">Xin chào,</div>
                <div
                  className="font-black text-sm text-primary truncate"
                  title={currentUser?.name || currentUser?.email}
                >
                  {currentUser?.name || currentUser?.email?.split("@")[0]}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="font-bold text-muted-foreground">Xin chào, Khách</div>
              <Link to="/login" className="text-xs text-primary hover:underline">
                Đăng nhập / Đăng ký
              </Link>
            </>
          )}
        </div>

        {/* Menu Tác vụ */}
        <nav className="space-y-1">
          {menu.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to as never}
              activeOptions={{ exact }}
              activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition text-card-foreground"
            >
              <Icon className="h-4 w-4 shrink-0" /> {label}
            </Link>
          ))}

          {/* Nút Đăng xuất thực tế */}
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-destructive/10 text-destructive font-medium transition text-left cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" /> Đăng xuất
            </button>
          )}
        </nav>
      </aside>

      {/* Vùng hiển thị nội dung chi tiết theo từng Route con */}
      <div className="rounded-xl bg-card p-6 shadow-[var(--shadow-card)] border">
        <Outlet />
      </div>
    </div>
  );
}
