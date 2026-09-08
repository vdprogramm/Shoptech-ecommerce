import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiAdminStats } from "@/lib/api/admin/api-admin-stats";
import { productService } from "@/lib/api/api-product";
import { adminUserService } from "@/lib/api/api-user";
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
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  Download,
  FileText,
} from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/admin/stats")({
  component: AdminStatsPage,
});

const PALETTE = ["#cb1c22", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"];

function AdminStatsPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  const fetchStatsData = async () => {
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

      const generalRaw = generalRes?.data || generalRes;
      const generalData = Array.isArray(generalRaw) ? generalRaw[0] : generalRaw || {};

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

      setStats({
        totalRevenue: useActualOrders ? actualRevenue : 0,
        totalOrders: useActualOrders ? actualOrderCount : 0,
        totalProducts: actualProductCount > 0 ? actualProductCount : generalData?.totalProducts || generalData?.products || generalData?.productCount || generalData?.stockProducts || 0,
        totalUsers: usersArray.length > 0 ? actualUserCount : 0,
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
                    const pId =
                      item.productId ||
                      item.product?._id ||
                      (typeof item.product === "string" ? item.product : null) ||
                      item._id;
                    let realName = item.name || item.product?.name || item.productName;

                    if (!realName && pId && productsArray.length > 0) {
                      const foundProduct = productsArray.find((p: any) => p._id === pId);
                      if (foundProduct) {
                        realName = foundProduct.name;
                      }
                    }

                    const name = realName || `Sản phẩm ${String(pId).slice(-4)}`;
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
      const rawPList = Array.isArray(pList) ? pList : [];
      const enrichedPList = rawPList.map((item: any) => {
        const pId =
          item.productId ||
          item.product?._id ||
          item._id ||
          (typeof item.product === "string" ? item.product : null);
        let realName = item.productName || item.product?.name || item.name || item.title;

        if ((!realName || realName === "Sản phẩm") && pId) {
          const foundProduct = productsArray.find((p: any) => String(p._id) === String(pId));
          if (foundProduct) {
            realName = foundProduct.name;
          }
        }

        return {
          ...item,
          name: realName || `Sản phẩm ID: ${String(pId || "").slice(-4)}`,
        };
      });

      setTopProducts(enrichedPList);
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu thống kê:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsData();
  }, [selectedYear, selectedMonth]);

  const hasRevenueData = revenueData.length > 0;
  const timeSeriesChartData = hasRevenueData
    ? revenueData.map((item: any, index: number) => ({
        name: item.name || `Ngày ${index + 1}`,
        "Doanh thu": item["Doanh thu"] || item.monthlyRevenue || item.revenue || item.totalRevenue || item.total || 0,
        "Đơn hàng": item["Đơn hàng"] || item.orderCount || item.orders || item.totalOrders || item.count || 0,
      }))
    : [{ name: "Chưa có dữ liệu", "Doanh thu": 0, "Đơn hàng": 0 }];

  const hasPieData = topProducts.length > 0;

  const pieChartData = hasPieData
    ? topProducts
        .map((item: any, index: number) => ({
          name:
            item.productName ||
            item.product?.name ||
            item.name ||
            item.title ||
            `Sản phẩm ${index + 1}`,
          value: item.value || item.totalSold || item.sold || item.quantity || item.count || 0,
        }))
        .sort((a: any, b: any) => b.value - a.value)
    : [{ name: "Không có dữ liệu", value: 100, isFallback: true }];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sm text-gray-500 animate-pulse">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <div>Đang nạp dữ liệu thống kê chi tiết...</div>
      </div>
    );
  }

  const exportToPDF = async () => {
    const element = document.getElementById("stats-dashboard");
    if (!element) return;

    try {
      setIsExportingPDF(true);
      // Đợi UI render xong các state đang loading
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 1. Chụp ảnh khu vực thống kê (Bao cân mọi loại màu oklch, hsl)
      const dataUrl = await toPng(element, {
        quality: 1,
        backgroundColor: "#ffffff", // Ép nền trắng để không bị lỗi nền trong suốt
        pixelRatio: 2, // Tăng độ nét gấp đôi
      });

      // 2. Khởi tạo trang PDF ngang (landscape), khổ A4
      const pdf = new jsPDF("l", "mm", "a4");

      // 3. Tính toán tỷ lệ ảnh để fit vừa trang PDF
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;

      // 4. Dán ảnh vào PDF và tải xuống
      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`thong_ke_shoptech_${selectedMonth}_${selectedYear}.pdf`);
    } catch (err) {
      console.error("Lỗi xuất PDF:", err);
      toast.error("Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại!");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const exportToWord = async () => {
    try {
      setIsExportingWord(true);
      await new Promise((resolve) => setTimeout(resolve, 50));
      const revenueFormatted =
        stats.totalRevenue >= 1000000
          ? `${(stats.totalRevenue / 1000000).toFixed(1)} triệu VND`
          : `${stats.totalRevenue.toLocaleString("vi-VN")} VND`;

      const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Báo Cáo Thống Kê</title>
        <style>
          body { font-family: 'Times New Roman', serif; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1, h2, h3 { color: #333; }
        </style>
      </head>
      <body>
        <h1 style="text-align:center; color: #d30000;">BÁO CÁO THỐNG KÊ SHOPTECH</h1>
        <h3 style="text-align:center;">Tháng ${selectedMonth} - Năm ${selectedYear}</h3>
        
        <h2>1. Tổng Quan</h2>
        <table>
          <tr><th>Chỉ tiêu</th><th>Kết quả</th></tr>
          <tr><td>Tổng Doanh Thu</td><td>${revenueFormatted}</td></tr>
          <tr><td>Tổng Đơn Hàng</td><td>${stats.totalOrders.toLocaleString("vi-VN")} đơn</td></tr>
          <tr><td>Tổng Người Dùng</td><td>${stats.totalUsers.toLocaleString("vi-VN")} khách hàng</td></tr>
          <tr><td>Sản Phẩm Đang Bán</td><td>${stats.totalProducts.toLocaleString("vi-VN")} sản phẩm</td></tr>
        </table>
        
        <h2>2. Top Sản Phẩm Bán Chạy (Tháng ${selectedMonth})</h2>
        <table>
          <tr><th>STT</th><th>Tên Sản Phẩm</th><th>Đã Bán</th></tr>
          ${pieChartData
            .map(
              (item: any, index: number) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.name}</td>
              <td>${item.isFallback ? 0 : item.value}</td>
            </tr>
          `,
            )
            .join("")}
        </table>
        
        <p style="text-align:right; margin-top:50px;">
          <em>Ngày xuất báo cáo: ${new Date().toLocaleDateString("vi-VN")}</em>
        </p>
      </body>
      </html>
    `;

      const blob = new Blob(["\ufeff", htmlContent], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bao_cao_shoptech_${selectedMonth}_${selectedYear}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Lỗi xuất Word:", err);
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="p-1 text-slate-800" id="stats-dashboard">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold">Thống kê chi tiết</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportToWord}
            disabled={isExportingWord || isExportingPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isExportingWord ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {isExportingWord ? "Đang xuất..." : "Xuất Word"}
          </button>

          {/* 🔴 SỬA CLASSS BG-DESTRUCTIVE TRONG NÚT PDF */}
          <button
            onClick={exportToPDF}
            disabled={isExportingWord || isExportingPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isExportingPDF ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExportingPDF ? "Đang xuất..." : "Xuất PDF"}
          </button>

          {/* 🔴 SỬA CLASS TRONG SELECT */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
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
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
          >
            {[selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 🔴 THAY TOÀN BỘ TEXT-MUTED-FOREGROUND / BG-CARD / BORDER-BORDER Ở CÁC THẺ CARD */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500">Tổng doanh thu</div>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">
            {stats.totalRevenue >= 1000000
              ? `${(stats.totalRevenue / 1000000).toFixed(1)}tr`
              : `${stats.totalRevenue.toLocaleString("vi-VN")}₫`}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500">Tổng đơn hàng</div>
            <Activity className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString("vi-VN")}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500">Người dùng</div>
            <PieIcon className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString("vi-VN")}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500">Sản phẩm</div>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString("vi-VN")}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold">Doanh thu & Đơn hàng (Tháng {selectedMonth}/{selectedYear})</h3>
            <p className="text-xs text-gray-500">
              Xu hướng doanh thu và số lượng đơn hàng trong tháng
            </p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timeSeriesChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickFormatter={(value) =>
                    value >= 1000000 ? `${(value / 1000000).toFixed(0)}tr` : value
                  }
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ color: "#0f172a", fontSize: "14px", fontWeight: 500 }}
                  labelStyle={{ color: "#64748b", fontSize: "12px", marginBottom: "4px" }}
                  formatter={(value: number, name: string) => [
                    name === "Doanh thu" ? `${value.toLocaleString("vi-VN")}₫` : value,
                    name,
                  ]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
                <Bar
                  yAxisId="left"
                  dataKey="Doanh thu"
                  fill="#cb1c22"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  yAxisId="right"
                  dataKey="Đơn hàng"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold">Top sản phẩm bán chạy</h3>
            <p className="text-xs text-gray-500">
              Tháng {selectedMonth}/{selectedYear}
            </p>
          </div>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieChartData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isFallback ? "#f1f5f9" : PALETTE[index % PALETTE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) =>
                    props.payload.isFallback
                      ? ["Chưa có dữ liệu", "Thông báo"]
                      : [`${value} sản phẩm`, "Đã bán"]
                  }
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <div className="text-sm text-gray-500">Top</div>
              <div className="text-xl font-bold">{hasPieData ? topProducts.length : 0}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2 max-h-[150px] overflow-y-auto pr-1">
            {pieChartData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 truncate pr-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: item.isFallback ? "#f1f5f9" : PALETTE[idx % PALETTE.length],
                    }}
                  ></div>
                  <span className="truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <span className="font-medium shrink-0">{item.isFallback ? "-" : item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
