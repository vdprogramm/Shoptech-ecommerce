import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { orderService } from "@/lib/api/api-order";
import { Loader2, PackageX, Package } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
export const Route = createFileRoute("/_site/account/orders")({
  component: MyOrdersPage,
});

interface IOrder {
  _id: string;
  orderCode?: string;
  totalAmount: number;
  createdAt: string;
  paymentStatus: string;
  status?: string;
  items?: any[];
  subOrders?: {
    _id: string;
    status: string;
    items?: any[];
  }[];
}

// Component con để hiển thị thông tin sản phẩm có khả năng tự fetch nếu backend chưa populate
function OrderItemPreview({ item }: { item: any }) {
  const initialName =
    item?.productName ||
    item?.product_name ||
    item?.title ||
    item?.name ||
    item?.variant?.name ||
    item?.product?.name;
  const initialImage =
    item?.image ||
    item?.productImage ||
    item?.variant?.images?.[0] ||
    item?.product?.images?.[0] ||
    item?.product?.image;

  const [name, setName] = useState(initialName || "Đang tải thông tin...");
  const [image, setImage] = useState(initialImage);

  useEffect(() => {
    if (
      !initialName ||
      initialName === "Sản phẩm" ||
      initialName === "Sản phẩm không xác định" ||
      name === "Đang tải thông tin..."
    ) {
      const fetchMissingProductInfo = async () => {
        try {
          const productId =
            item?.productId ||
            item?.product?._id ||
            (typeof item?.product === "string" ? item.product : null);
          if (productId) {
            const { productService } = await import("@/lib/api/api-product");
            const prod = await productService.getProductById(productId);
            if (prod) {
              setName(prod.name);
              if (!image && prod.images && prod.images.length > 0) {
                setImage(prod.images[0]);
              }
            } else {
              setName("Sản phẩm không xác định");
            }
          } else {
            setName("Sản phẩm không xác định");
          }
        } catch (e) {
          setName("Sản phẩm không xác định");
        }
      };
      fetchMissingProductInfo();
    }
  }, [item, initialName, image, name]);

  return (
    <div className="flex items-center gap-4 py-2 border-b last:border-b-0 border-border/50">
      <div className="w-14 h-14 rounded-lg bg-white border flex items-center justify-center overflow-hidden shrink-0">
        {image ? (
          <img src={getImageUrl(image)} alt={name} className="w-full h-full object-contain p-1" />
        ) : (
          <Package className="w-6 h-6 text-muted-foreground opacity-30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground line-clamp-2">{name}</p>
        <div className="text-xs text-muted-foreground mt-1 flex gap-3">
          <span>SL: x{item?.quantity || 1}</span>
          {item?.price ? <span className="font-medium">{item.price.toLocaleString()}đ</span> : null}
        </div>
      </div>
    </div>
  );
}

function OrderProductPreview({ order }: { order: IOrder }) {
  const allItems = order.items
    ? order.items
    : order.subOrders?.flatMap((sub) => sub.items || []) || [];

  return (
    <div className="flex flex-col">
      {allItems.map((item, idx) => (
        <OrderItemPreview key={idx} item={item} />
      ))}
    </div>
  );
}

function MyOrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const confirmCancelOrder = async (orderId: string) => {
    try {
      setIsCancelling(true);
      await orderService.cancelOrder(orderId);
      const data = await orderService.getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
      showSuccessModal("Hủy đơn hàng thành công");
      setOrderToCancel(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi hủy đơn hàng");
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const data = await orderService.getMyOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi khi tải danh sách đơn hàng:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusFormat = (status: string) => {
    switch (status) {
      case "Pending":
        return {
          text: "Chờ xác nhận",
          bg: "bg-yellow-50",
          textClass: "text-yellow-700",
          border: "border-yellow-200",
        };
      case "Processing":
        return {
          text: "Đang xử lý",
          bg: "bg-blue-50",
          textClass: "text-blue-700",
          border: "border-blue-200",
        };
      case "Shipped":
        return {
          text: "Đang giao",
          bg: "bg-orange-50",
          textClass: "text-orange-700",
          border: "border-orange-200",
        };
      case "Delivered":
        return {
          text: "Đã giao",
          bg: "bg-green-50",
          textClass: "text-green-700",
          border: "border-green-200",
        };
      case "Cancelled":
        return {
          text: "Đã huỷ",
          bg: "bg-red-50",
          textClass: "text-red-700",
          border: "border-red-200",
        };
      default:
        return {
          text: status,
          bg: "bg-gray-50",
          textClass: "text-gray-700",
          border: "border-gray-200",
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      <h2 className="text-xl font-bold mb-4 text-foreground">Đơn hàng của tôi</h2>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-dashed">
            <PackageX className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">Bạn chưa có đơn hàng nào.</p>
          </div>
        ) : (
          orders.map((o) => {
            const status = o.status || o.subOrders?.[0]?.status || "Pending";
            const ui = getStatusFormat(status);

            return (
              <div
                key={o._id}
                className="flex flex-col gap-3 rounded-xl bg-card border shadow-sm p-4 text-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <div className="font-semibold text-foreground">
                      Mã đơn: #{o.orderCode || o._id.slice(-6).toUpperCase()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Ngày đặt: {formatDate(o.createdAt)}
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full border text-xs font-medium ${ui.bg} ${ui.textClass} ${ui.border}`}
                  >
                    {ui.text}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <OrderProductPreview order={o} />
                  </div>
                  <div className="text-right flex flex-col items-end gap-2 shrink-0 ml-4">
                    <div className="text-primary font-bold text-base">
                      {(o.totalAmount || 0).toLocaleString()}₫
                    </div>
                    <div className="flex flex-col gap-2 w-full mt-1">
                      <Link
                        to="/track-order/$orderId"
                        params={{ orderId: o._id }}
                        className="text-white bg-primary px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors text-center block w-full"
                      >
                        Xem chi tiết
                      </Link>
                      {status === "Pending" && (
                        <button
                          onClick={() => setOrderToCancel(o.subOrders?.[0]?._id || o._id)}
                          className="text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-destructive/20 transition-colors text-center w-full"
                        >
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AlertDialog
        open={!!orderToCancel}
        onOpenChange={(open) => !open && !isCancelling && setOrderToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Trở lại</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isCancelling}
              onClick={(e) => {
                e.preventDefault();
                if (orderToCancel) confirmCancelOrder(orderToCancel);
              }}
            >
              {isCancelling ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                "Hủy đơn hàng"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
