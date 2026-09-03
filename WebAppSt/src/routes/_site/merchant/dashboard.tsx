import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
// Giả sử bạn có service cho merchant, nếu chưa có, bạn có thể dùng chung apiAdminStats
import { apiAdminStats } from "@/lib/api/admin/api-admin-stats";
import { authService } from "@/lib/api/api-auth";
import { axiosClient } from "@/lib/api/axios-client";
import { apiMerchant } from "@/lib/api/api-merchant";
import { orderService } from "@/lib/api/api-order";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, Package } from "lucide-react";

export const Route = createFileRoute("/_site/merchant/dashboard")({
  component: MerchantDashboardPage,
});

function MerchantDashboardPage() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const COLORS = ["#eab308", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];

  const currentUser = authService.getCurrentUser();
  const storeId = currentUser?.storeId;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ordersRes, productsRes] = await Promise.allSettled([
        orderService.getOrdersByStore(),
        apiMerchant.getProducts(),
      ]);

      if (ordersRes.status === "rejected") console.error("Lỗi tải đơn hàng:", ordersRes.reason);
      if (productsRes.status === "rejected") console.error("Lỗi tải sản phẩm:", productsRes.reason);

      const ordersData = ordersRes.status === "fulfilled" ? ordersRes.value || [] : [];
      // apiMerchant.getProducts() trả về response của axios
      const productsData = productsRes.status === "fulfilled" ? productsRes.value?.data || [] : [];

      let totalRevenue = 0;
      let totalOrders = 0;
      const statusCount: Record<string, number> = {
        Pending: 0,
        Processing: 0,
        Delivered: 0,
        Cancelled: 0,
      };

      // Khởi tạo mảng thống kê 12 tháng
      const monthlyData: Record<string, { revenue: number; orders: number }> = {};
      for (let i = 1; i <= 12; i++) {
        monthlyData[i.toString()] = { revenue: 0, orders: 0 };
      }

      const currentYear = new Date().getFullYear();

      ordersData.forEach((order: any) => {
        (order.subOrders || []).forEach((sub: any) => {
          totalOrders++; // Đếm mọi subOrder cho cửa hàng

          const status = sub.status || "Pending";
          if (statusCount[status] !== undefined) {
            statusCount[status]++;
          } else {
            statusCount[status] = 1;
          }

          const orderDate = new Date(sub.createdAt || order.createdAt || new Date());
          const year = orderDate.getFullYear();
          const month = (orderDate.getMonth() + 1).toString();

          // Doanh thu chỉ tính những đơn đã Delivered
          if (sub.status === "Delivered") {
            let amount = sub.grandTotal || 0;
            const totalGrandTotals = (order.subOrders || []).reduce(
              (sum: number, s: any) => sum + (s.grandTotal || 0),
              0,
            );

            if (
              order.totalAmount !== undefined &&
              totalGrandTotals > 0 &&
              order.totalAmount < totalGrandTotals
            ) {
              const ratio = amount / totalGrandTotals;
              const discount = (totalGrandTotals - order.totalAmount) * ratio;
              amount = Math.max(0, amount - discount);
            } else if (
              order.totalAmount !== undefined &&
              order.totalAmount < amount &&
              (order.subOrders || []).length === 1
            ) {
              amount = Math.max(0, order.totalAmount);
            }

            totalRevenue += amount;

            if (year === currentYear) {
              monthlyData[month].revenue += amount;
              monthlyData[month].orders += 1; // Số lượng đơn đã Delivered
            }
          }
        });
      });

      // Convert statusCount to array cho PieChart
      const pieData = Object.keys(statusCount)
        .map((key) => ({
          name: key,
          value: statusCount[key],
        }))
        .filter((item) => item.value > 0);

      setStatusData(pieData);

      setStats({
        revenue: totalRevenue,
        orders: totalOrders,
        products: productsData.length || 0,
      });

      // Chuyển monthlyData thành mảng chartData
      const chartDataArray = [];
      for (let i = 1; i <= 12; i++) {
        chartDataArray.push({
          name: `Tháng ${i}`,
          "Doanh thu": monthlyData[i.toString()].revenue,
          "Đơn hàng": monthlyData[i.toString()].orders,
        });
      }
      setRevenueData(chartDataArray);
    } catch (err) {
      console.error("Lỗi tải dashboard merchant:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Không cần map lại chartData vì đã xử lý ở trên
  const chartData = revenueData;

  if (isLoading) return <div className="p-6">Đang tải dữ liệu...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">📊 Tổng quan cửa hàng</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-400">Doanh thu</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.revenue.toLocaleString("vi-VN")}₫
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-400">Đơn hàng</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.orders}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-400">Sản phẩm</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.products}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h2 className="font-bold text-lg">Doanh thu & Đơn hàng (Hàng tháng)</h2>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                <Tooltip
                  formatter={(val: number, name: string) =>
                    name === "Doanh thu" ? `${val.toLocaleString("vi-VN")}₫` : val
                  }
                />
                <Legend />
                <Bar yAxisId="left" dataKey="Doanh thu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="Đơn hàng" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Package className="h-5 w-5 text-purple-500" />
            <h2 className="font-bold text-lg">Trạng thái đơn hàng</h2>
          </div>
          <div className="h-[350px] w-full">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                Chưa có đơn hàng nào
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <h2 className="font-bold text-lg">Xu hướng doanh thu</h2>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(val: number) => `${val.toLocaleString("vi-VN")}₫`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="Doanh thu"
                stroke="#10b981"
                strokeWidth={3}
                activeDot={{ r: 8 }}
                name="Doanh thu"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
