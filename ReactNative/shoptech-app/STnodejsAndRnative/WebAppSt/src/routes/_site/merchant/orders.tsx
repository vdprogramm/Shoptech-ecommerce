import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { orderService } from "@/lib/api/api-order";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";
import { productService } from "@/lib/api/api-product";

// Component hỗ trợ lấy tên sản phẩm nếu backend chỉ trả về string ID hoặc tên chung chung "Sản phẩm"
function AsyncProductName({ itemData }: { itemData: any }) {
  let initialName = itemData?.name || itemData?.product?.name || itemData?.productName;
  if (initialName === "Sản phẩm" || initialName === "Sản Phẩm") {
    initialName = ""; // Ép hệ thống gọi API để lấy tên thật
  }

  const productId =
    itemData?.productId ||
    itemData?.product?._id ||
    (typeof itemData?.product === "string" ? itemData.product : null);
  const [name, setName] = useState(initialName || "Đang tải...");

  useEffect(() => {
    if (!initialName && productId) {
      productService
        .getProductById(productId)
        .then((res) => {
          if (res && res.name) setName(res.name);
          else setName("Sản phẩm không xác định");
        })
        .catch(() => setName("Sản phẩm không xác định"));
    } else if (!initialName && !productId) {
      setName("Sản phẩm không xác định");
    }
  }, [productId, initialName]);

  return <>{name}</>;
}

export const Route = createFileRoute("/_site/merchant/orders")({
  component: MerchantOrdersPage,
});

function MerchantOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const fetchStoreOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrdersByStore();
      setOrders(data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreOrders();
  }, []);

  const handleUpdateStatus = async (subOrderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(subOrderId);

      // 1. Gọi API
      await orderService.updateOrderStatus(subOrderId, newStatus);

      // 2. CẬP NHẬT UI TỨC THÌ (Đã thêm xử lý an toàn với '|| []')
      setOrders((prevOrders) =>
        prevOrders.map((order) => ({
          ...order,
          subOrders: (order.subOrders || []).map((sub: any) =>
            sub._id === subOrderId ? { ...sub, status: newStatus } : sub,
          ),
        })),
      );

      showSuccessModal("Cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi:", error);
      toast.error("Có lỗi xảy ra khi cập nhật!");
      // Nếu lỗi, tải lại dữ liệu từ server để đồng bộ
      fetchStoreOrders();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getFinalPrice = (order: any, sub: any) => {
    let finalAmount = sub.grandTotal || 0;
    const totalGrandTotals = (order.subOrders || []).reduce(
      (sum: number, s: any) => sum + (s.grandTotal || 0),
      0,
    );

    if (
      order.totalAmount !== undefined &&
      totalGrandTotals > 0 &&
      order.totalAmount < totalGrandTotals
    ) {
      const ratio = finalAmount / totalGrandTotals;
      const discount = (totalGrandTotals - order.totalAmount) * ratio;
      finalAmount = finalAmount - discount;
    } else if (
      order.totalAmount !== undefined &&
      order.totalAmount < finalAmount &&
      (order.subOrders || []).length === 1
    ) {
      finalAmount = order.totalAmount;
    }

    return Math.max(0, finalAmount);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Đơn hàng của cửa hàng</h1>
        <button
          onClick={fetchStoreOrders}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-red-600" size={40} />
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b text-left">
              <tr>
                <th className="p-4">Mã đơn con</th>
                <th className="p-4">Người mua</th>
                <th className="p-4">Sản phẩm</th>
                <th className="p-4">Tổng tiền (Đã trừ Voucher)</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((o) =>
                    (o.subOrders || []).map((sub: any) => (
                      <tr key={sub._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono font-medium text-slate-700">
                          #{sub._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-sm">
                            {o.user?.fullName || o.user?.name || "Khách ẩn danh"}
                          </div>
                          {o.user?.email && (
                            <div className="text-xs text-slate-500 mt-1">{o.user.email}</div>
                          )}
                          {o.shippingAddress && (
                            <div
                              className="text-xs mt-1 text-slate-500 max-w-[150px] truncate"
                              title={o.shippingAddress}
                            >
                              📍 {o.shippingAddress}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          {(sub.items || []).map((item: any) => (
                            <div key={item.variant} className="text-xs text-slate-600">
                              <AsyncProductName itemData={item} /> (x{item.quantity})
                            </div>
                          ))}
                        </td>
                        <td className="p-4 font-semibold text-red-600">
                          {getFinalPrice(o, sub).toLocaleString()}₫
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium 
                                                    ${
                                                      sub.status === "Pending"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : sub.status === "Processing"
                                                          ? "bg-blue-100 text-blue-800"
                                                          : sub.status === "Shipped"
                                                            ? "bg-orange-100 text-orange-800"
                                                            : sub.status === "Cancelled"
                                                              ? "bg-red-100 text-red-800"
                                                              : "bg-green-100 text-green-800"
                                                    }`}
                          >
                            {sub.status === "Pending"
                              ? "Chờ xác nhận"
                              : sub.status === "Processing"
                                ? "Đang xử lý"
                                : sub.status === "Shipped"
                                  ? "Đang giao"
                                  : sub.status === "Delivered"
                                    ? "Đã giao"
                                    : sub.status === "Cancelled"
                                      ? "Đã huỷ"
                                      : sub.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {/* Nút dành cho đơn đang chờ (Pending) */}
                          {sub.status === "Pending" && (
                            <button
                              onClick={() => handleUpdateStatus(sub._id, "Processing")}
                              disabled={updatingOrderId === sub._id}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 transition-all flex items-center gap-2 ml-auto"
                            >
                              {updatingOrderId === sub._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : null}
                              Xác nhận
                            </button>
                          )}

                          {/* Nút dành cho đơn đang xử lý (Processing) -> Bàn giao cho shipper */}
                          {sub.status === "Processing" && (
                            <button
                              onClick={() => handleUpdateStatus(sub._id, "Shipped")}
                              disabled={updatingOrderId === sub._id}
                              className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center gap-2 ml-auto"
                            >
                              {updatingOrderId === sub._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : null}
                              Giao vận chuyển
                            </button>
                          )}

                          {/* Nút dành cho đơn đang giao (Shipped) -> Khách đã nhận được hàng */}
                          {sub.status === "Shipped" && (
                            <button
                              onClick={() => handleUpdateStatus(sub._id, "Delivered")}
                              disabled={updatingOrderId === sub._id}
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 transition-all flex items-center gap-2 ml-auto"
                            >
                              {updatingOrderId === sub._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : null}
                              Hoàn thành
                            </button>
                          )}
                        </td>
                      </tr>
                    )),
                  )
              )}
            </tbody>
          </table>

          {Math.ceil(orders.length / itemsPerPage) > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-slate-500">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, orders.length)} trên tổng {orders.length} đơn
                hàng
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                  Trang trước
                </button>
                <span className="text-sm font-medium px-2">
                  Trang {currentPage} / {Math.ceil(orders.length / itemsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(Math.ceil(orders.length / itemsPerPage), p + 1))
                  }
                  disabled={currentPage === Math.ceil(orders.length / itemsPerPage)}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
