import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";
import { useEffect, useState } from "react";
import { orderService } from "@/lib/api/api-order";
import { reviewService } from "@/lib/api/api-review";
import { Store, Package, Star, X, CheckCircle2, Loader2 } from "lucide-react";
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
export const Route = createFileRoute("/_site/track-order/$orderId")({
  component: TrackOrderPage,
});

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  Pending: { label: "Chờ xác nhận", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  Processing: { label: "Đang xử lý", cls: "bg-blue-50   text-blue-700   border-blue-200" },
  Shipped: { label: "Đang giao", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  Delivered: { label: "Đã giao", cls: "bg-green-50  text-green-700  border-green-200" },
  Cancelled: { label: "Đã huỷ", cls: "bg-red-50    text-red-700    border-red-200" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? {
    label: status,
    cls: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ========================
// STAR RATING INPUT
// ========================
function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className="w-8 h-8"
            fill={(hovered || value) >= star ? "#f59e0b" : "none"}
            stroke={(hovered || value) >= star ? "#f59e0b" : "#d1d5db"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

// ========================
// REVIEW MODAL
// ========================
interface ReviewModalProps {
  productId: string;
  productName: string;
  productImage?: string;
  onClose: () => void;
  onSuccess: (productId: string) => void;
}

function ReviewModal({
  productId,
  productName,
  productImage,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Vui lòng nhập nhận xét.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await reviewService.addReview({ productId, rating, comment: comment.trim() });
      setDone(true);
      setTimeout(() => {
        onSuccess(productId);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card rounded-2xl shadow-2xl border w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-lg text-foreground">Đánh giá sản phẩm</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-bold text-foreground text-lg">Cảm ơn bạn đã đánh giá!</p>
            <p className="text-muted-foreground text-sm">Đánh giá của bạn đã được ghi nhận.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Product preview */}
            <div className="flex items-center gap-3 bg-secondary/40 rounded-xl p-3">
              <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center overflow-hidden shrink-0">
                {productImage ? (
                  <img
                    src={getImageUrl(productImage)}
                    alt={productName}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <Package className="w-6 h-6 text-muted-foreground opacity-40" />
                )}
              </div>
              <p className="text-sm font-medium text-foreground line-clamp-2 flex-1">
                {productName}
              </p>
            </div>

            {/* Stars */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Chất lượng sản phẩm</label>
              <StarInput value={rating} onChange={setRating} />
              <p className="text-xs text-muted-foreground">
                {["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Rất tốt"][rating]}
              </p>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Nhận xét của bạn</label>
              <textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setError("");
                }}
                rows={4}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Star className="w-4 h-4" />
              )}
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ========================
// MAIN PAGE
// ========================
function TrackOrderPage() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Lưu các productId đã đánh giá trong phiên này
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  // State modal
  const [reviewModal, setReviewModal] = useState<{
    productId: string;
    productName: string;
    productImage?: string;
  } | null>(null);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        let data;
        try {
          data = await orderService.getOrderDetails(orderId);
        } catch {
          data = await orderService.trackOrderByCode(orderId);
        }
        const orderData = data?.order || data?.data || data;
        setOrder(orderData);
      } catch (err) {
        console.error("Không tìm thấy đơn hàng", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetail();
  }, [orderId]);

  const handleReviewSuccess = (productId: string) => {
    setReviewedIds((prev) => new Set([...prev, productId]));
  };

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const confirmCancelOrder = async () => {
    try {
      setIsCancelling(true);
      await orderService.cancelOrder(orderId);
      showSuccessModal("Hủy đơn hàng thành công");
      setShowCancelConfirm(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi hủy đơn hàng");
    } finally {
      setIsCancelling(false);
    }
  };

  // Lấy status tổng của đơn hàng
  const orderStatus = order?.status || order?.subOrders?.[0]?.status || "Pending";
  const isDelivered = orderStatus === "Delivered";

  // Helper: extract productId from item
  const getProductId = (item: any): string | null =>
    item?.productId ||
    item?.product?._id ||
    (typeof item?.product === "string" ? item.product : null);

  return (
    <>
      <Breadcrumb items={[{ label: "Tra cứu đơn hàng" }]} />
      <PageHeader
        title="Chi tiết đơn hàng"
        subtitle={`Mã đơn: #${order?.orderCode || orderId.substring(orderId.length - 6).toUpperCase()}`}
      />

      <div className="container mx-auto px-4 pb-16 max-w-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Đang tải thông tin đơn hàng...</p>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* ── THÔNG TIN CHUNG ── */}
            <div className="rounded-2xl bg-card p-6 shadow-sm border relative space-y-4">
              <h3 className="font-bold text-lg text-foreground">Thông tin chung</h3>
              {orderStatus === "Pending" && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="absolute top-5 right-6 text-sm text-destructive font-semibold border border-destructive/20 bg-destructive/10 hover:bg-destructive/20 px-4 py-1.5 rounded-xl transition-colors"
                >
                  Hủy đơn hàng
                </button>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Mã đơn hàng</p>
                  <p className="font-semibold text-foreground font-mono">
                    #{order?.orderCode || orderId.substring(orderId.length - 6).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Trạng thái</p>
                  <StatusBadge status={orderStatus} />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Ngày đặt hàng</p>
                  <p className="font-medium text-foreground">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("vi-VN")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Tổng thanh toán</p>
                  <p className="font-bold text-primary text-base">
                    {(order.totalAmount || 0).toLocaleString()}₫
                  </p>
                </div>
              </div>

              {/* Banner giao thành công */}
              {isDelivered && (
                <div className="mt-2 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Đơn hàng đã được giao thành công!
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Hãy đánh giá sản phẩm để giúp người mua khác.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── CHI TIẾT SẢN PHẨM ── */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-foreground">Chi tiết sản phẩm</h3>

              {order.subOrders && order.subOrders.length > 0 ? (
                order.subOrders.map((sub: any, index: number) => {
                  const subStatus = sub.status || orderStatus;
                  const subDelivered = subStatus === "Delivered";
                  return (
                    <div
                      key={sub._id || index}
                      className="rounded-2xl bg-card shadow-sm border overflow-hidden"
                    >
                      {/* Store header */}
                      <div className="bg-secondary/50 px-4 py-3 flex items-center gap-2 border-b">
                        <Store className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-sm text-foreground flex-1">
                          {sub.store?.name || sub.merchant?.name || "Cửa hàng đối tác"}
                        </span>
                        <StatusBadge status={subStatus} />
                      </div>

                      {/* Items */}
                      <div className="p-4 space-y-4 divide-y divide-border">
                        {sub.items && sub.items.length > 0 ? (
                          sub.items.map((item: any, i: number) => {
                            const pid = getProductId(item);
                            const itemName =
                              item.name || item.variant?.name || item.product?.name || "Sản phẩm";
                            const itemImg =
                              item.image || item.variant?.images?.[0] || item.product?.images?.[0];
                            const canReview = subDelivered && !!pid && !reviewedIds.has(pid);
                            const alreadyReviewed = pid && reviewedIds.has(pid);

                            return (
                              <div key={i} className="flex gap-4 items-center pt-4 first:pt-0">
                                <div className="w-16 h-16 rounded-xl border bg-white flex items-center justify-center overflow-hidden shrink-0">
                                  {itemImg ? (
                                    <img
                                      src={getImageUrl(itemImg)}
                                      alt={itemName}
                                      className="w-full h-full object-contain p-1"
                                    />
                                  ) : (
                                    <Package className="w-8 h-8 text-muted-foreground opacity-30" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm line-clamp-2 text-foreground">
                                    {itemName}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Số lượng: {item.quantity || 1}
                                  </p>
                                  {/* Nút đánh giá */}
                                  {canReview && (
                                    <button
                                      onClick={() =>
                                        setReviewModal({
                                          productId: pid!,
                                          productName: itemName,
                                          productImage: itemImg,
                                        })
                                      }
                                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-3 py-1 rounded-full transition-colors"
                                    >
                                      <Star
                                        className="w-3.5 h-3.5"
                                        fill="#d97706"
                                        stroke="#d97706"
                                      />
                                      Đánh giá ngay
                                    </button>
                                  )}
                                  {alreadyReviewed && (
                                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Đã đánh giá
                                    </span>
                                  )}
                                </div>
                                <div className="font-semibold text-sm text-foreground whitespace-nowrap shrink-0">
                                  {(
                                    (item.price || item.unitPrice || item.variant?.price || 0) *
                                    (item.quantity || 1)
                                  ).toLocaleString()}
                                  ₫
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">
                            Không có chi tiết sản phẩm.
                          </p>
                        )}

                        <div className="pt-3 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Thành tiền (cửa hàng này)
                          </span>
                          <span className="font-bold text-primary">
                            {(
                              sub.grandTotal ||
                              sub.totalAmount ||
                              order.totalAmount ||
                              0
                            ).toLocaleString()}
                            ₫
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : order.items && order.items.length > 0 ? (
                <div className="rounded-2xl bg-card shadow-sm border overflow-hidden">
                  <div className="bg-secondary/50 px-4 py-3 flex items-center gap-2 border-b">
                    <Store className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-sm text-foreground flex-1">
                      ShopTech Official
                    </span>
                    <StatusBadge status={orderStatus} />
                  </div>
                  <div className="p-4 space-y-4 divide-y divide-border">
                    {order.items.map((item: any, i: number) => {
                      const pid = getProductId(item);
                      const itemName =
                        item.name || item.variant?.name || item.product?.name || "Sản phẩm";
                      const itemImg =
                        item.image ||
                        item.variant?.images?.[0] ||
                        item.product?.images?.[0] ||
                        item.product?.image;
                      const canReview = isDelivered && !!pid && !reviewedIds.has(pid);
                      const alreadyReviewed = pid && reviewedIds.has(pid);

                      return (
                        <div key={i} className="flex gap-4 items-center pt-4 first:pt-0">
                          <div className="w-16 h-16 rounded-xl border bg-white flex items-center justify-center overflow-hidden shrink-0">
                            {itemImg ? (
                              <img
                                src={getImageUrl(itemImg)}
                                alt={itemName}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-muted-foreground opacity-30" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-2 text-foreground">
                              {itemName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.variant?.color ? `Màu: ${item.variant.color} · ` : ""}Số lượng:{" "}
                              {item.quantity || 1}
                            </p>
                            {canReview && (
                              <button
                                onClick={() =>
                                  setReviewModal({
                                    productId: pid!,
                                    productName: itemName,
                                    productImage: itemImg,
                                  })
                                }
                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-3 py-1 rounded-full transition-colors"
                              >
                                <Star className="w-3.5 h-3.5" fill="#d97706" stroke="#d97706" />
                                Đánh giá ngay
                              </button>
                            )}
                            {alreadyReviewed && (
                              <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Đã đánh giá
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-sm text-foreground whitespace-nowrap shrink-0">
                            {(
                              (item.price ||
                                item.unitPrice ||
                                item.variant?.price ||
                                item.product?.price ||
                                0) * (item.quantity || 1)
                            ).toLocaleString()}
                            ₫
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-3 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tổng cộng</span>
                      <span className="font-bold text-primary">
                        {(order.totalAmount || 0).toLocaleString()}₫
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-card p-6 shadow-sm border text-center text-muted-foreground text-sm">
                  Đơn hàng này không có dữ liệu chi tiết sản phẩm.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-red-500 py-10 rounded-2xl bg-red-50 border border-red-100 font-medium">
            Không tìm thấy đơn hàng!
          </div>
        )}
      </div>

      {/* REVIEW MODAL */}
      {reviewModal && (
        <ReviewModal
          productId={reviewModal.productId}
          productName={reviewModal.productName}
          productImage={reviewModal.productImage}
          onClose={() => setReviewModal(null)}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* CANCEL CONFIRM MODAL */}
      <AlertDialog
        open={showCancelConfirm}
        onOpenChange={(open) => !open && !isCancelling && setShowCancelConfirm(false)}
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
                confirmCancelOrder();
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
