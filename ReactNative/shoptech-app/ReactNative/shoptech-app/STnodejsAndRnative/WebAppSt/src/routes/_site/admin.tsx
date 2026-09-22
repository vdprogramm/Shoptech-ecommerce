import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { AuthUser } from "@/types/auth";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  BarChart3,
  Store,
  Zap,
  Newspaper,
  Grid,
  ShieldCheck,
  MessageSquare,
  Truck,
  Bot,
  Image,
} from "lucide-react";
import { toast } from "sonner";



const menu = [
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { to: "/admin/stores", label: "Cửa hàng toàn quốc", icon: Store },
  { to: "/admin/categories", label: "Danh mục", icon: Grid },
  { to: "/admin/banners", label: "Banner", icon: Image },
  { to: "/admin/brands", label: "Thương hiệu", icon: Tag },
  { to: "/admin/products", label: "Sản phẩm", icon: Package },
  { to: "/admin/orders", label: "Đơn hàng", icon: ShoppingBag },
  { to: "/admin/warranties", label: "Bảo hành", icon: ShieldCheck },
  { to: "/admin/users", label: "Người dùng", icon: Users },
  { to: "/admin/shippers", label: "Người giao hàng", icon: Truck },
  { to: "/admin/reviews", label: "Đánh giá", icon: MessageSquare },
  { to: "/admin/vouchers", label: "Voucher", icon: Tag },
  { to: "/admin/flash-sales", label: "Flash Sales", icon: Zap },
  { to: "/admin/news", label: "Tin tức", icon: Newspaper },
  { to: "/admin/stats", label: "Thống kê", icon: BarChart3 },
  { to: "/admin/chatbot-history", label: "Lịch sử Chatbot", icon: Bot },
];

export const Route = createFileRoute("/_site/admin")({
  beforeLoad: async ({ location }) => {
    const userStorage = localStorage.getItem("user");

    if (!userStorage) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    const user: AuthUser = JSON.parse(userStorage);

    const isAdmin = user.roles?.some((role) => role === "ADMIN");

    if (!isAdmin) {
      toast.error("Tài khoản của bạn không có quyền truy cập vào khu vực quản trị!");
      throw redirect({
        to: "/",
      });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
      <aside className="rounded-xl bg-card p-3 shadow-[var(--shadow-card)] h-fit">
        <div className="px-3 py-3 border-b mb-2">
          <div className="font-bold text-primary">QUẢN TRỊ</div>
          <div className="text-xs text-muted-foreground">EShop Admin</div>
        </div>
        <nav className="space-y-1">
          {menu.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to as never}
              activeOptions={{ exact }}
              activeProps={{ className: "bg-primary/10 text-primary font-bold" }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-all"
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="rounded-xl bg-card p-6 shadow-[var(--shadow-card)]">
        <Outlet />
      </div>
    </div>
  );
}
