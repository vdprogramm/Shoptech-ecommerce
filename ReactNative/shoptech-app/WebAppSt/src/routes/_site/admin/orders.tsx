import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { orderService } from "@/lib/api/api-order";
import { Loader2 } from "lucide-react";
import { adminStoreService } from "@/lib/api/admin/api-admin-store";
import { productService } from "@/lib/api/api-product";

// Component hỗ trợ lấy tên cửa hàng nếu backend chỉ trả về object rỗng hoặc string ID
function AsyncStoreName({ storeData }: { storeData: any }) {
  const initialName = storeData?.name || storeData?.storeName;
  const storeId = typeof storeData === "string" ? storeData : storeData?._id || storeData?.id;
  const [name, setName] = useState(initialName || "Đang tải...");

  useEffect(() => {
    if (!initialName && storeId) {
      adminStoreService
        .getStoreById(storeId)
        .then((res) => {
          if (res && res.name) setName(res.name);
          else setName("Cửa hàng không xác định");
        })
        .catch(() => setName("Cửa hàng không xác định"));
    } else if (!initialName && !storeId) {
      setName("Cửa hàng không xác định");
    }
  }, [storeId, initialName]);

  return <>{name}</>;
}

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

export const Route = createFileRoute("/_site/admin/orders")({
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const data = await orderService.getAdminOrdersForAdmin();
        console.log("Admin orders data received:", data); // Giúp debug xem data trả về dạng gì
        // Nếu data trả về bị bọc trong object (ví dụ: { data: [...] } hoặc { orders: [...] })
        const ordersArray = Array.isArray(data) ? data : data?.data || data?.orders || [];
        setOrders(ordersArray);
        setCurrentPage(1);
      } catch (error) {
        console.error("Lỗi khi tải đơn hàng cho Admin:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return "text-yellow-600 bg-yellow-50";
      case "Delivered":
        return "text-green-600 bg-green-50";
      case "Cancelled":
        return "text-red-600 bg-red-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Quản lý đơn hàng (Admin)</h2>

      {isLoading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">Mã đơn</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Chi tiết (Sản phẩm & Cửa hàng)</th>
                <th className="p-4">Tổng tiền</th>
                <th className="p-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Không có dữ liệu đơn hàng
                  </td>
                </tr>
              ) : (
                orders
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((o) => {
                    // SỬA Ở ĐÂY: Truy cập đúng field fullName (khớp với Backend .populate)
                    // Nếu Backend bạn để 'name' thì đổi lại thành o.user?.name
                    const customerName = o.user?.fullName || o.user?.name || "Khách ẩn danh";
                    const orderId = o._id || o.id || "";
                    const orderCode =
                      o.orderCode || (orderId ? orderId.slice(-6).toUpperCase() : "N/A");

                    return (
                      <tr key={orderId} className="hover:bg-muted/30 align-top">
                        <td className="p-4 font-semibold">#{orderCode}</td>
                        <td className="p-4">
                          <div className="font-semibold">{customerName}</div>
                          {o.user?.email && (
                            <div className="text-xs text-muted-foreground mt-1">{o.user.email}</div>
                          )}
                          {o.shippingAddress && (
                            <div
                              className="text-xs mt-1 text-slate-500 max-w-[200px] truncate"
                              title={o.shippingAddress}
                            >
                              📍 {o.shippingAddress}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          {(o.subOrders || []).map((sub: any, i: number) => (
                            <div
                              key={sub._id || i}
                              className="mb-3 last:mb-0 bg-muted/20 p-2 rounded-md"
                            >
                              <div className="font-semibold text-xs text-primary mb-1">
                                🏪 <AsyncStoreName storeData={sub.store} />
                              </div>
                              <div className="space-y-1">
                                {(sub.items || []).map((item: any, j: number) => (
                                  <div key={j} className="text-sm flex items-start gap-1">
                                    <span className="text-muted-foreground">-</span>
                                    <span>
                                      <AsyncProductName itemData={item} />{" "}
                                      <span className="font-medium text-xs text-muted-foreground">
                                        (x{item.quantity})
                                      </span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </td>
                        <td className="p-4 font-bold text-primary">
                          {o.totalAmount?.toLocaleString() || 0}₫
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            {(o.subOrders || []).map((sub: any, i: number) => (
                              <span
                                key={i}
                                className={`px-2 py-1 rounded-md text-xs font-medium w-fit ${getStatusStyle(sub.status)}`}
                                title={sub.store?.name}
                              >
                                {sub.status || "N/A"}
                              </span>
                            ))}
                            {(!o.subOrders || o.subOrders.length === 0) && (
                              <span
                                className={`px-2 py-1 rounded-md text-xs font-medium w-fit ${getStatusStyle(o.status)}`}
                              >
                                {o.status || "N/A"}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>

          {Math.ceil(orders.length / itemsPerPage) > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, orders.length)} trên tổng {orders.length} đơn
                hàng
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-muted transition-colors"
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
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-muted transition-colors"
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
