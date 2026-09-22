import {
  Search,
  ShoppingCart,
  User,
  MapPin,
  Phone,
  Heart,
  Bell,
  LogOut,
  UserCheck,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { authService } from "@/lib/api/api-auth";
import { categoryService, Category } from "@/lib/api/api-category";
import { notificationService } from "@/lib/api/api-notification";

const convertToSlug = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

export function Header() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  // State danh mục động từ Backend
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);

  // State quản lý trạng thái đăng nhập
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const checkAuthStatus = () => {
    const authCheck = authService.isAuthenticated();
    setIsLoggedIn(authCheck);
    if (authCheck) {
      setCurrentUser(authService.getCurrentUser());
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    // 1. Kiểm tra Auth
    checkAuthStatus();
    window.addEventListener("storage", checkAuthStatus);
    const authInterval = setInterval(checkAuthStatus, 500);

    // 2. Lấy danh mục sản phẩm thực tế từ NestJS
    categoryService
      .getAllCategories()
      .then((data) => setDbCategories(data))
      .catch((err) => console.error("Lỗi lấy danh mục tại Header:", err))
      .finally(() => setIsCategoryLoading(false));

    return () => {
      window.removeEventListener("storage", checkAuthStatus);
      clearInterval(authInterval);
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      notificationService
        .getHistory()
        .then((data) => setUnreadCount(data.filter((n) => !n.isRead).length))
        .catch((err) => console.error("Lỗi lấy thông báo tại Header:", err));
    } else {
      setUnreadCount(0);
    }
  }, [isLoggedIn]);

  const handleLogoutClick = () => {
    setShowDropdown(false);
    authService.logout();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q } });
  };

  return (
    <header
      className="sticky top-0 z-50 shadow-md"
      style={{ background: "var(--gradient-header)" }}
    >
      {/* Top Bar */}
      <div className="border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between px-4 py-1 text-xs text-white/90">
          <div className="flex items-center gap-4">
            <Link to="/stores" className="flex items-center gap-1 hover:underline">
              <MapPin className="h-3 w-3" /> Hệ thống cửa hàng
            </Link>
            <span className="hidden md:flex items-center gap-1">
              <Phone className="h-3 w-3" /> 1800.6601
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <a href="/track-order" className="hover:underline">
              Tra cứu đơn hàng
            </a>
            <Link to="/news" className="hover:underline">
              Tin công nghệ
            </Link>
            <Link to="/promotions" className="hover:underline">
              Khuyến mãi
            </Link>
            {isLoggedIn && currentUser?.roles && (
              <>
                {currentUser.roles.includes("ADMIN") && (
                  <Link
                    to="/admin"
                    className="font-bold text-yellow-300 hover:underline flex items-center gap-1"
                  >
                    👑 Quản trị Hệ thống
                  </Link>
                )}

                {(currentUser.roles.includes("STORE_OWNER") ||
                  currentUser.roles.includes("STORE_STAFF")) && (
                  <Link
                    to="/merchant/dashboard"
                    className="font-bold text-teal-300 hover:underline flex items-center gap-1"
                  >
                    🏪 Quản lý Cửa hàng
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="container mx-auto flex items-center gap-4 px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white font-extrabold text-primary text-lg">
            S
          </div>
          <div className="hidden sm:block text-white">
            <div className="text-lg font-extrabold leading-none tracking-tight">ShopTech</div>
            <div className="text-[10px] opacity-90">ĐIỆN TỬ CHÍNH HÃNG</div>
          </div>
        </Link>

        {/* Search Bar */}
        <form onSubmit={submit} className="flex-1 max-w-2xl">
          <div className="flex items-center rounded-full bg-white px-4 py-2 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Bạn cần tìm gì hôm nay?..."
              className="ml-2 w-full bg-transparent text-sm text-black outline-none placeholder:text-muted-foreground"
            />
          </div>
        </form>

        {/* Actions Icons */}
        <div className="flex items-center gap-1 text-white">
          <IconLink
            to="/account/notifications"
            icon={<Bell className="h-5 w-5" />}
            label="Thông báo"
            badge={unreadCount}
          />
          <IconLink to="/account/wishlist" icon={<Heart className="h-5 w-5" />} label="Yêu thích" />
          <IconLink
            to="/cart"
            icon={<ShoppingCart className="h-5 w-5" />}
            label="Giỏ hàng"
            badge={0}
          />

          {/* Profile Renders */}
          <div className="relative flex items-center">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex flex-col items-center rounded-md px-2 py-1 text-[10px] transition hover:bg-white/15 outline-none cursor-pointer"
                >
                  <div className="relative flex items-center justify-center h-5 w-5 overflow-hidden rounded-full bg-yellow-300/20 text-yellow-500 shrink-0">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                  </div>
                  <span className="hidden md:flex items-center gap-0.5 mt-0.5 font-bold max-w-[75px] truncate">
                    {currentUser?.fullName ||
                      currentUser?.name ||
                      currentUser?.email?.split("@")[0] ||
                      "User"}
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  </span>
                </button>

                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-48 z-20 overflow-hidden rounded-xl border bg-card text-card-foreground p-1 shadow-xl">
                      <div className="px-3 py-1.5 border-b text-[10px] font-semibold text-muted-foreground">
                        Tài khoản ShopTech
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setShowDropdown(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-secondary transition text-card-foreground"
                      >
                        <User className="h-3.5 w-3.5 text-primary" /> Trang cá nhân
                      </Link>
                      <button
                        onClick={handleLogoutClick}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-destructive hover:bg-destructive/10 transition font-medium cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <IconLink to="/login" icon={<User className="h-5 w-5" />} label="Đăng nhập" />
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar Động theo API */}
      <nav className="border-t border-white/10">
        <div className="container mx-auto flex items-center gap-1 overflow-x-auto px-4 py-2 text-sm text-white no-scrollbar">
          {isCategoryLoading ? (
            <div className="flex items-center gap-2 text-white/70 text-xs px-3 py-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang đồng bộ danh mục...
            </div>
          ) : (
            dbCategories.map((c) => {
              const currentSlug = convertToSlug(c.name);
              return (
                <Link
                  key={c._id}
                  to="/category/$slug"
                  params={{ slug: currentSlug }}
                  // Đồng thời gán kèm ID vào search để trang chi tiết dễ gọi API tìm sản phẩm theo ID danh mục
                  search={{ id: c._id } as any}
                  className="whitespace-nowrap rounded-full px-3 py-1 font-medium transition hover:bg-white/15 text-white"
                  activeProps={{ className: "bg-white/20" }}
                >
                  {c.name}
                </Link>
              );
            })
          )}
        </div>
      </nav>
    </header>
  );
}

function IconLink({
  to,
  icon,
  label,
  badge,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      to={to as never}
      className="relative flex flex-col items-center rounded-md px-2 py-1 text-[10px] transition hover:bg-white/15 text-white"
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
            {badge}
          </span>
        )}
      </div>
      <span className="hidden md:block mt-0.5">{label}</span>
    </Link>
  );
}
