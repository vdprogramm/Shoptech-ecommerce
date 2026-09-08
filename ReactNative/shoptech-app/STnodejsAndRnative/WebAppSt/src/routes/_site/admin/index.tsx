import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiAdminStats } from "@/lib/api/admin/api-admin-stats";
import { productService } from "@/lib/api/api-product";
import { adminUserService } from "@/lib/api/api-user";
import { orderService } from "@/lib/api/api-order";
import axiosClient from "@/lib/api/axios-client";
import {
  ComposedChart,
  Bar,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  FunnelChart as RechartsFunnelChart,
  Funnel,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  Activity,
  Columns,
} from "lucide-react";

export const Route = createFileRoute("/_site/admin/")({
  component: AdminDashboard,
});

const PALETTE = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"];

function AdminDashboard() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    newOrders: 0,
    newCustomers: 0,
    stockProducts: 0,
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [
        generalResult,
        revenueResult,
        topProductsResult,
        productsResult,
        usersResult,
        ordersResult,
      ] = await Promise.allSettled([
        apiAdminStats.getDashboardStats(),
        apiAdminStats.getRevenueStats(selectedYear),
        apiAdminStats.getTopProducts(selectedYear, selectedMonth),
        productService.getProducts(),
        adminUserService.getAllUsers(),
        orderService.getAdminOrdersForAdmin(),
      ]);

      const generalRes = generalResult.status === "fulfilled" ? generalResult.value : null;
      const revenueRes = revenueResult.status === "fulfilled" ? revenueResult.value : null;
      const topProductsRes =
        topProductsResult.status === "fulfilled" ? topProductsResult.value : null;
      const productsRes = productsResult.status === "fulfilled" ? productsResult.value : null;
      const usersRes = usersResult.status === "fulfilled" ? usersResult.value : null;
      const ordersRes = ordersResult.status === "fulfilled" ? ordersResult.value : null;

      if (generalResult.status === "rejected")
        console.error("Lỗi lấy thống kê chung:", generalResult.reason);
      if (revenueResult.status === "rejected")
        console.error("Lỗi lấy doanh thu:", revenueResult.reason);
      if (topProductsResult.status === "rejected")
        console.error("Lỗi lấy top sản phẩm:", topProductsResult.reason);

      // Xử lý trường hợp backend trả về { data: ... }
      const generalRaw = generalRes?.data || generalRes;
      const generalData = Array.isArray(generalRaw) ? generalRaw[0] : generalRaw || {};

      // Tính toán số lượng thực tế từ các API danh sách
      const productsArray = Array.isArray(productsRes)
        ? productsRes
        : (productsRes as any)?.data || [];
      const usersArray = Array.isArray(usersRes) ? usersRes : (usersRes as any)?.data || [];
      const ordersArray = Array.isArray(ordersRes)
        ? ordersRes
        : (ordersRes as any)?.data || (ordersRes as any)?.orders || [];

      // Lọc theo tháng và năm được chọn
      const currentMonthOrders = ordersArray.filter((o: any) => {
        if (!o.createdAt) return false;
        const d = new Date(o.createdAt);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      });

      const currentMonthUsers = usersArray.filter((u: any) => {
        if (!u.createdAt) return false;
        const d = new Date(u.createdAt);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      });

      const actualProductCount = productsArray.length; // Sản phẩm tồn kho giữ nguyên tổng số
      const actualUserCount = currentMonthUsers.length;
      const actualOrderCount = currentMonthOrders.length;

      // Tính tổng doanh thu dựa trên các đơn hàng đã "Delivered" trong tháng
      const useActualOrders = ordersArray.length > 0;
      const actualRevenue = useActualOrders
        ? currentMonthOrders.reduce((sum: number, o: any) => {
            const status = o.subOrders?.[0]?.status || o.status;
            if (status === "Delivered") {
              return sum + (Number(o.totalAmount) || Number(o.grandTotal) || 0);
            }
            return sum;
          }, 0)
        : 0;

      console.log("Debug General Data:", generalData);
      console.log(
        "Filtered Counts (Products, Users, Orders):",
        actualProductCount,
        actualUserCount,
        actualOrderCount,
      );
      console.log("Filtered Delivered Revenue:", actualRevenue);

      setStats({
        todayRevenue: useActualOrders
          ? actualRevenue
          : 0,
        newOrders: useActualOrders
          ? actualOrderCount
          : 0,
        newCustomers: usersArray.length > 0
          ? actualUserCount
          : 0,
        stockProducts: actualProductCount > 0
          ? actualProductCount
          : generalData?.stockProducts || generalData?.totalProducts || 0,
      });

      // Generate daily chart data for the selected month
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const dailyData = Array.from({ length: daysInMonth }).map((_, i) => ({
        name: `${i + 1}/${selectedMonth}`,
        "Doanh thu": 0,
        "Đơn hàng": 0,
      }));

      let hasCurrentMonthData = false;
      if (currentMonthOrders && currentMonthOrders.length > 0) {
        currentMonthOrders.forEach((o: any) => {
          if (!o.createdAt) return;
          const date = new Date(o.createdAt);
          const dIndex = date.getDate() - 1;
          const status = o.subOrders?.[0]?.status || o.status;
          if (status === "Delivered") {
            dailyData[dIndex]["Doanh thu"] += Number(o.totalAmount) || Number(o.grandTotal) || 0;
          }
          dailyData[dIndex]["Đơn hàng"] += 1;
          hasCurrentMonthData = true;
        });
      }
      
      let rList = hasCurrentMonthData ? dailyData : [];

      let pList = topProductsRes?.data || topProductsRes;
      if (pList && !Array.isArray(pList))
        pList =
          pList.list ||
          pList.data ||
          pList.items ||
          pList.products ||
          Object.values(pList).find(Array.isArray) ||
          [];

      if (!pList || pList.length === 0) {
        const productMap: Record<string, { name: string; sold: number }> = {};
        if (ordersArray && ordersArray.length > 0) {
          ordersArray.forEach((o: any) => {
            if (!o.createdAt) return;
            const date = new Date(o.createdAt);
            if (date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth) {
              const status = o.subOrders?.[0]?.status || o.status;
              if (status !== "Cancelled") {
                const subs = o.subOrders && o.subOrders.length > 0 ? o.subOrders : [o];
                subs.forEach((sub: any) => {
                  const items = sub.items || o.items || [];
                  items.forEach((item: any) => {
                    const pId = item.productId || item._id || item.name;
                    const name = item.name || "Sản phẩm";
                    const qty = Number(item.quantity || item.qty || 1);
                    if (!productMap[pId]) productMap[pId] = { name, sold: 0 };
                    productMap[pId].sold += qty;
                  });
                });
              }
            }
          });
        }
        pList = Object.values(productMap)
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 5);
      }

      setRevenueData(Array.isArray(rList) ? rList : []);
      setTopProducts(Array.isArray(pList) ? pList : []);
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu đồ thị tổng hợp:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, selectedMonth]);

  // 1. Dữ liệu thực tế cho Bar, Column, Line, Combo Charts
  const hasRevenueData = revenueData.length > 0;
  const timeSeriesChartData = hasRevenueData
    ? revenueData.map((item: any, index: number) => ({
        name: item.name || `Ngày ${index + 1}`,
        "Doanh thu": item["Doanh thu"] || item.monthlyRevenue || item.revenue || item.totalRevenue || item.total || 0,
        "Đơn hàng": item["Đơn hàng"] || item.orderCount || item.orders || item.totalOrders || item.count || 0,
      }))
    : [{ name: "Chưa có dữ liệu", "Doanh thu": 0, "Đơn hàng": 0 }];

  // 2. Dữ liệu thực tế cho Pie Chart
  const hasPieData = topProducts.length > 0;
  const pieChartData = hasPieData
    ? topProducts.map((item: any, index: number) => ({
        name: item.name || item.productName || item.title || `Sản phẩm ${index + 1}`,
        value: item.value || item.totalSold || item.sold || item.quantity || item.count || 0,
      }))
    : [{ name: "Không có dữ liệu", value: 100, isFallback: true }];

  // 3. Dữ liệu Funnel Chart
  const funnelChartData = [
    { value: stats.newCustomers * 4 || 0, name: "Xem sản phẩm", fill: "#3b82f6" },
    { value: stats.newCustomers * 2 || 0, name: "Thêm vào giỏ", fill: "#f59e0b" },
    { value: stats.newOrders || 0, name: "Tạo đơn hàng", fill: "hsl(var(--primary))" },
  ];
  const hasFunnelData = funnelChartData.some((d) => d.value > 0);

  // 4. Dữ liệu Waterfall Chart (Bản sửa lỗi kết xuất thanh lơ lửng)
  const waterfallChartData = [
    { name: "Doanh thu", uv: [0, stats.todayRevenue], displayValue: stats.todayRevenue },
    {
      name: "Vận hành",
      uv: [stats.todayRevenue * 0.8, stats.todayRevenue],
      displayValue: -(stats.todayRevenue * 0.2),
    },
    {
      name: "Nhập hàng",
      uv: [stats.todayRevenue * 0.3, stats.todayRevenue * 0.8],
      displayValue: -(stats.todayRevenue * 0.5),
    },
    {
      name: "Lợi nhuận",
      uv: [0, stats.todayRevenue * 0.3],
      displayValue: stats.todayRevenue * 0.3,
    },
  ];
  const hasWaterfallData = stats.todayRevenue > 0;

  const kpis = [
    {
      label: "Doanh thu hôm nay",
      value:
        stats.todayRevenue >= 1000000
          ? `${(stats.todayRevenue / 1000000).toFixed(1)}tr`
          : `${stats.todayRevenue.toLocaleString("vi-VN")}₫`,
      color: "text-primary",
    },
    {
      label: "Đơn hàng mới",
      value: stats.newOrders.toLocaleString("vi-VN"),
      color: "text-success",
    },
    {
      label: "Khách hàng mới",
      value: stats.newCustomers.toLocaleString("vi-VN"),
      color: "text-warning",
    },
    {
      label: "Sản phẩm tồn kho",
      value: stats.stockProducts.toLocaleString("vi-VN"),
      color: "text-foreground",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sm text-muted-foreground animate-pulse">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
        <div>Đang nạp hệ thống phân tích đa tầng ShopTech...</div>
      </div>
    );
  }

  return (
    <div className="p-1 text-card-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold">Tổng quan hệ thống</h2>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Tháng {i + 1}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs Số liệu */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border p-4 bg-background shadow-sm">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* LƯỚI KHÔNG GIAN BIỂU ĐỒ ĐA DẠNG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. COMBO CHART */}
        <div className="rounded-xl border p-5 bg-background shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm">1. Combo Chart (Phối hợp đa tầng)</h3>
          </div>
          <div className="h-[240px] text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeSeriesChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: any) =>
                    typeof value === "number" ? value.toLocaleString("vi-VN") : value
                  }
                />
                <Legend />
                <Bar
                  dataKey="Doanh thu"
                  fill="hsl(var(--primary))"
                  barSize={20}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="Đơn hàng"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. COLUMN CHART */}
        <div className="rounded-xl border p-5 bg-background shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Columns className="h-4 w-4 text-blue-500" />
            <h3 className="font-bold text-sm">2. Column Chart (Doanh thu cột dọc)</h3>
          </div>
          <div className="h-[240px] text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeSeriesChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: any) => `${value.toLocaleString("vi-VN")}₫`} />
                <Bar dataKey="Doanh thu" fill="#3b82f6" barSize={30} radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. BAR CHART */}
        <div className="rounded-xl border p-5 bg-background shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            <h3 className="font-bold text-sm">3. Bar Chart (Thanh ngang sản lượng)</h3>
          </div>
          <div className="h-[240px] text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart layout="vertical" data={timeSeriesChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="Đơn hàng" fill="#10b981" barSize={15} radius={[0, 4, 4, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. LINE CHART */}
        <div className="rounded-xl border p-5 bg-background shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-amber-500" />
            <h3 className="font-bold text-sm">4. Line Chart (Biến động đơn hàng)</h3>
          </div>
          <div className="h-[240px] text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="Đơn hàng"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. PIE CHART */}
        <div className="rounded-xl border p-5 bg-background shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="h-4 w-4 text-purple-500" />
            <h3 className="font-bold text-sm">5. Pie Chart (Tỷ trọng sản phẩm bán chạy)</h3>
          </div>
          <div className="h-[240px] flex items-center justify-center text-xs relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieChartData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isFallback ? "gray" : PALETTE[index % PALETTE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) =>
                    typeof value === "number" ? value.toLocaleString("vi-VN") : value
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            {!hasPieData && (
              <div className="absolute text-[11px] text-muted-foreground bg-background/80 px-2 py-1 rounded">
                0% Thực tế
              </div>
            )}
          </div>
        </div>

        {/* 6. FUNNEL CHART */}
        <div className="rounded-xl border p-5 bg-background shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-pink-500" />
            <h3 className="font-bold text-sm">6. Funnel Chart (Hiệu suất phễu bán hàng)</h3>
          </div>
          <div className="h-[240px] text-xs flex items-center justify-center relative">
            {hasFunnelData ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsFunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={funnelChartData} isAnimationActive>
                    {funnelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Funnel>
                </RechartsFunnelChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-center">
                0% - Hệ thống chưa có lượt tương tác
              </div>
            )}
          </div>
        </div>

        {/* 7. WATERFALL CHART */}
        <div className="lg:col-span-2 rounded-xl border p-5 bg-background shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-cyan-500 rotate-90" />
            <h3 className="font-bold text-sm">
              7. Waterfall Chart (Dòng thác phân tích dòng tiền phát sinh)
            </h3>
          </div>
          <div className="h-[240px] text-xs">
            {hasWaterfallData ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={waterfallChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => [
                      `${props.payload.displayValue.toLocaleString("vi-VN")}₫`,
                      "Biến động",
                    ]}
                  />
                  <Bar dataKey="uv" radius={[4, 4, 4, 4]}>
                    {waterfallChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.displayValue < 0 ? "#ef4444" : "#10b981"}
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Mức 0% - Chưa phát sinh dòng tiền doanh thu hôm nay để tính toán phân rã dòng thác
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
