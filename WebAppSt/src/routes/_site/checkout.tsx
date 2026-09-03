import React, { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";
import { voucherService } from "@/lib/api/api-voucher";
import { orderService } from "@/lib/api/api-order";
import { cartService } from "@/lib/api/api-cart";
import { flashSaleService } from "@/lib/api/api-flash-sale";
import { shippingMethodService, IShippingMethod } from "@/lib/api/api-shipping-method";
import { paymentService } from "@/lib/api/api-payment";
import {
  Ticket,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
  Info,
  Plus,
  Minus,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

export const Route = createFileRoute("/_site/checkout")({
  component: Checkout,
});

interface ICartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number; // Giá đã được Backend xử lý Flash Sale
  quantity: number;
  image: string;
  variantName?: string;
  storeId?: string;
}

interface IPublicVoucher {
  _id: string;
  code: string;
  discountAmount: number;
  discountType: "fixed" | "percent";
  minOrderValue: number;
  expirationDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  description?: string;
  store?: any;
}

function Checkout() {
  const navigate = useNavigate();

  // --- STATE QUẢN LÝ DỮ LIỆU THẬT ---
  const [cartItems, setCartItems] = useState<ICartItem[]>([]);
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [isLoadingCart, setIsLoadingCart] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // 🌟 Thêm để chống spam click đặt đơn

  // --- STATE PHƯƠNG THỨC VẬN CHUYỂN ---
  const [shippingMethods, setShippingMethods] = useState<IShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<IShippingMethod | null>(
    null,
  );
  const [isLoadingShipping, setIsLoadingShipping] = useState<boolean>(true);

  // --- STATE QUẢN LÝ VOUCHER ---
  const [couponCode, setCouponCode] = useState<string>("");
  const [publicVouchers, setPublicVouchers] = useState<IPublicVoucher[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState<boolean>(false);

  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    voucherId: string;
    discountValue: number;
    minOrderValue: number;
  } | null>(null);

  const [isCheckingVoucher, setIsCheckingVoucher] = useState<boolean>(false);
  const [voucherError, setVoucherError] = useState<string>("");
  const [voucherSuccess, setVoucherSuccess] = useState<string>("");

  // --- STATE THÔNG TIN GIAO HÀNG ---
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    paymentMethod: "Thanh toán khi nhận hàng (COD)",
  });

  // 🎯 HÀM LẤY GIỎ HÀNG QUA SERVICE & MAPPING ĐỒNG BỘ CẤU TRÚC GIẢM GIÁ
  const loadCartFromBackend = async () => {
    try {
      setIsLoadingCart(true);
      const backendCart = await cartService.getCart();

      if (backendCart && backendCart.items) {
        const validItems = backendCart.items.filter(
          (item: any) => item.variant !== null && item.variant !== undefined,
        );

        // Bổ sung logic lấy giá Flash Sale giống bên giỏ hàng
        const flashSaleMap = new Map();
        try {
          const campaigns = await flashSaleService.getAllCampaigns();
          const now = new Date().getTime();
          const activeCampaigns = campaigns.filter(
            (c) => c.isActive && new Date(c.endTime).getTime() > now,
          );

          activeCampaigns.forEach((campaign: any) => {
            if (campaign.items) {
              campaign.items.forEach((saleItem: any) => {
                const variantId =
                  typeof saleItem.variant === "object" ? saleItem.variant._id : saleItem.variant;
                flashSaleMap.set(variantId, saleItem);
              });
            }
          });
        } catch (fsErr) {
          console.error("Lỗi lấy dữ liệu Flash Sale ở Checkout:", fsErr);
        }

        const mappedItems: ICartItem[] = validItems.map((item: any) => {
          const flashItem = flashSaleMap.get(item.variant._id);
          const actualPrice = flashItem ? flashItem.salePrice : item.variant.price || 0;

          let storeId = "";
          const pStore = item.variant.product?.store || item.variant.store;
          if (pStore) {
            if (Array.isArray(pStore)) {
              storeId =
                typeof pStore[0] === "object" && pStore[0] !== null ? pStore[0]._id : pStore[0];
            } else {
              storeId = typeof pStore === "object" && pStore !== null ? pStore._id : pStore;
            }
          }

          const productImages = item.variant.product?.images || [];
          const displayImg =
            item.variant.imageUrl ||
            (item.variant.images && item.variant.images.length > 0
              ? item.variant.images[0]
              : null) ||
            (productImages.length > 0 ? productImages[0] : null) ||
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500";

          return {
            productId: item.variant.product?._id || item.variant.product || "",
            variantId: item.variant._id,
            name: item.variant.name || "Sản phẩm ưu đãi",
            price: actualPrice,
            quantity: item.quantity,
            image: displayImg,
            variantName: item.variant.color || item.variant.variantName || "Phiên bản lựa chọn",
            storeId: storeId,
          };
        });

        setCartItems(mappedItems);
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu từ giỏ hàng Service:", err);
    } finally {
      setIsLoadingCart(false);
    }
  };

  // 1. Khởi tạo: Gọi đồng bộ giỏ hàng từ DB và danh sách Voucher hệ thống
  useEffect(() => {
    loadCartFromBackend();

    const loadSystemVouchers = async () => {
      try {
        setIsLoadingVouchers(true);
        const data = await voucherService.getPublicVouchers();
        setPublicVouchers(data || []);
      } catch (error) {
        console.error("Không thể lấy danh sách voucher khuyến mãi:", error);
      } finally {
        setIsLoadingVouchers(false);
      }
    };

    const loadShippingMethods = async () => {
      try {
        setIsLoadingShipping(true);
        const methods = await shippingMethodService.getActiveMethods();
        setShippingMethods(methods || []);
        if (methods && methods.length > 0) {
          setSelectedShippingMethod(methods[0]); // Mặc định chọn phương thức đầu tiên
        }
      } catch (error) {
        console.error("Không thể lấy danh sách phương thức vận chuyển:", error);
      } finally {
        setIsLoadingShipping(false);
      }
    };

    loadSystemVouchers();
    loadShippingMethods();
  }, []);

  // 2. EFFECT THEO DÕI SỰ THAY ĐỔI CỦA GIỎ HÀNG ĐỂ TÍNH TIỀN ĐỘNG & KIỂM TRA VOUCHER
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setOrderTotal(total);

    if (appliedVoucher && total < appliedVoucher.minOrderValue) {
      setAppliedVoucher(null);
      setVoucherSuccess("");
      setVoucherError(
        `Đã hủy mã ${appliedVoucher.code} do tổng đơn hàng tụt xuống dưới mức tối thiểu (${appliedVoucher.minOrderValue.toLocaleString()}₫)`,
      );
    }
  }, [cartItems, appliedVoucher]);

  // 3. Hàm cập nhật số lượng: Đồng bộ thẳng qua API Service giỏ hàng
  const updateQuantity = async (
    productId: string,
    variantId: string | undefined,
    delta: number,
  ) => {
    if (!variantId) return;

    const currentItem = cartItems.find(
      (item) => item.productId === productId && item.variantId === variantId,
    );
    if (!currentItem) return;

    const newQty = currentItem.quantity + delta;
    if (newQty <= 0) return;

    try {
      await cartService.updateQuantity(variantId, newQty);
      await loadCartFromBackend();
    } catch (err) {
      console.error("Lỗi cập nhật số lượng qua API Service:", err);
      toast.error("Không thể cập nhật số lượng, vui lòng thử lại!");
    }
  };

  // 4. Hàm xóa sản phẩm: Đồng bộ lệnh xóa qua API Service giỏ hàng
  const removeItem = async (productId: string, variantId: string | undefined) => {
    if (!variantId) return;
    try {
      await cartService.removeItem(variantId);
      await loadCartFromBackend();
    } catch (err) {
      console.error("Lỗi xóa sản phẩm qua API Service:", err);
      toast.error("Xóa sản phẩm khỏi giỏ hàng thất bại!");
    }
  };

  const displayVouchers = React.useMemo(() => {
    const storeIdsInCart = new Set<string>();
    cartItems.forEach(item => {
      if (item.storeId) {
        storeIdsInCart.add(item.storeId);
      }
    });

    return publicVouchers.filter(voucher => {
      // Nếu không có store -> Admin tạo -> hiển thị cho tất cả
      if (!voucher.store) return true;
      
      // Nếu có store, kiểm tra xem giỏ hàng có chứa sản phẩm của store này không
      const vStoreId = typeof voucher.store === "object" ? voucher.store._id : voucher.store;
      return storeIdsInCart.has(vStoreId);
    });
  }, [publicVouchers, cartItems]);

  // 5. Hàm xử lý áp dụng mã giảm giá
  const handleApplyVoucher = async (targetCode?: string) => {
    const codeToValidate = targetCode || couponCode;

    if (!codeToValidate.trim()) {
      setVoucherError("Vui lòng nhập hoặc chọn mã giảm giá.");
      return;
    }

    const foundVoucherMeta = publicVouchers.find(
      (v) => v.code.toUpperCase() === codeToValidate.toUpperCase(),
    );

    let applicableTotal = orderTotal;
    if (foundVoucherMeta?.store) {
      const vStoreId =
        typeof foundVoucherMeta.store === "object"
          ? foundVoucherMeta.store._id
          : foundVoucherMeta.store;
      applicableTotal = cartItems
        .filter((item) => item.storeId === vStoreId)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (applicableTotal === 0) {
        setVoucherError("Mã giảm giá này chỉ áp dụng cho sản phẩm của gian hàng tương ứng.");
        setAppliedVoucher(null);
        return;
      }
    }

    if (foundVoucherMeta && applicableTotal < foundVoucherMeta.minOrderValue) {
      setVoucherError(
        `Mã này chỉ áp dụng khi tổng giá trị các sản phẩm hợp lệ đạt từ ${foundVoucherMeta.minOrderValue.toLocaleString()}₫ trở lên.`,
      );
      setAppliedVoucher(null);
      return;
    }

    try {
      setIsCheckingVoucher(true);
      setVoucherError("");
      setVoucherSuccess("");

      const res = await voucherService.checkVoucher(codeToValidate, applicableTotal);

      setAppliedVoucher({
        code: res.code,
        voucherId: res.voucherId,
        discountValue: res.discountValue,
        minOrderValue: foundVoucherMeta ? foundVoucherMeta.minOrderValue : 0,
      });
      setVoucherSuccess(
        `Áp dụng thành công! Bạn được giảm -${res.discountValue.toLocaleString()}₫`,
      );
      setCouponCode(res.code);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Mã giảm giá không đủ điều kiện đơn hàng tối thiểu.";
      setVoucherError(errorMsg);
      setAppliedVoucher(null);
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const shippingFee = selectedShippingMethod ? selectedShippingMethod.baseFee : 0;
  const finalTotal = Math.max(0, orderTotal + shippingFee - (appliedVoucher?.discountValue || 0));

  // ⚡ HÀM KÍCH HOẠT ĐẶT HÀNG LÊN NESTJS BACKEND
  const handlePlaceOrder = async () => {
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng bắt buộc!");
      return;
    }

    if (!selectedShippingMethod) {
      toast.error("Vui lòng chọn phương thức vận chuyển!");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Giỏ hàng của bạn đang trống. Không thể đặt hàng.");
      return;
    }

    const detailedAddress = `${shippingInfo.address} (Người nhận: ${shippingInfo.fullName} - SĐT: ${shippingInfo.phone})`;

    const orderPayload: any = {
      shippingAddress: detailedAddress,
      paymentMethod: shippingInfo.paymentMethod,
    };

    if (selectedShippingMethod) {
      orderPayload.shippingMethod = selectedShippingMethod._id;
    }

    if (appliedVoucher && appliedVoucher.code) {
      orderPayload.voucherCode = appliedVoucher.code;
    }

    try {
      setIsSubmitting(true);
      const response = await orderService.createOrder(orderPayload);
      console.log("Kết quả tạo đơn hàng thành công:", response);

      const orderId = response._id || response.order?._id || response.data?._id;
      // Lấy subOrderId từ mảng subOrders (đơn hàng con)
      const subOrderId =
        response.subOrders?.[0]?._id ||
        response.order?.subOrders?.[0]?._id ||
        response.data?.subOrders?.[0]?._id;

      if (shippingInfo.paymentMethod === "Cổng VNPAY" && orderId) {
        try {
          const paymentRes = await paymentService.createVnpayUrl(orderId, finalTotal);
          if (paymentRes.url) {
            window.location.href = paymentRes.url;
            return;
          }
        } catch (paymentErr) {
          console.error("Lỗi tạo link thanh toán VNPAY:", paymentErr);
          toast.error(
            "Đặt hàng thành công nhưng lỗi tạo link thanh toán VNPAY! Vui lòng thử thanh toán lại sau.",
          );
          navigate({ to: "/account/orders" as any });
          return;
        }
      } else if (shippingInfo.paymentMethod === "Thanh toán qua VietQR") {
        const targetId = subOrderId || orderId;
        if (!targetId) {
          showSuccessModal("Không tìm thấy mã đơn hàng con (subOrderId) để thanh toán VietQR.");
          navigate({ to: "/account/orders" as any });
          return;
        }
        try {
          const paymentRes = await paymentService.createVietqrUrl(targetId);
          // PayOS usually returns checkoutUrl, but we check url as fallback
          const redirectUrl =
            paymentRes?.checkoutUrl || paymentRes?.url || paymentRes?.data?.checkoutUrl;

          if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
          }
        } catch (paymentErr) {
          console.error("Lỗi tạo link thanh toán VietQR:", paymentErr);
          toast.error(
            "Đặt hàng thành công nhưng lỗi tạo link thanh toán VietQR! Vui lòng thử lại sau.",
          );
          navigate({ to: "/account/orders" as any });
          return;
        }
      }

      navigate({
        to: "/checkout-success",
        search: {
          orderId: orderId,
          subOrderId: subOrderId,
        },
      } as any);
    } catch (error: any) {
      console.error("Lỗi hệ thống khi xử lý đặt hàng:", error);
      const backendMessage = error.response?.data?.message;
      const errorMessage = Array.isArray(backendMessage)
        ? backendMessage[0]
        : backendMessage || "Đặt hàng thất bại. Vui lòng thử lại!";

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Giỏ hàng", to: "/cart" }, { label: "Thanh toán" }]} />
      <PageHeader title="Thanh toán đơn hàng" />

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
        {/* KHỐI TRÁI: THÔNG TIN KHÁCH HÀNG & PHƯƠNG THỨC */}
        <div className="lg:col-span-7 space-y-4">
          <section className="rounded-xl bg-card p-5 shadow-[var(--shadow-card)] border">
            <h3 className="font-bold mb-4 text-base text-foreground flex items-center gap-2">
              Thông tin giao hàng
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <input
                className="rounded-lg border px-3 py-2.5 bg-background focus:outline-primary"
                placeholder="Họ tên người nhận *"
                value={shippingInfo.fullName}
                onChange={(e) => setShippingInfo((prev) => ({ ...prev, fullName: e.target.value }))}
                disabled={isSubmitting}
              />
              <input
                className="rounded-lg border px-3 py-2.5 bg-background focus:outline-primary"
                placeholder="Số điện thoại liên hệ *"
                value={shippingInfo.phone}
                onChange={(e) => setShippingInfo((prev) => ({ ...prev, phone: e.target.value }))}
                disabled={isSubmitting}
              />
              <input
                className="col-span-2 rounded-lg border px-3 py-2.5 bg-background focus:outline-primary"
                placeholder="Địa chỉ Email (Nhận hóa đơn)"
                type="email"
                value={shippingInfo.email}
                onChange={(e) => setShippingInfo((prev) => ({ ...prev, email: e.target.value }))}
                disabled={isSubmitting}
              />
              <input
                className="col-span-2 rounded-lg border px-3 py-2.5 bg-background focus:outline-primary"
                placeholder="Địa chỉ giao hàng chi tiết (Số nhà, Tên đường, Phường/Xã...) *"
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo((prev) => ({ ...prev, address: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          </section>
          <section className="rounded-xl bg-card p-5 shadow-[var(--shadow-card)] border">
            <h3 className="font-bold mb-4 text-base text-foreground flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" /> Phương thức vận chuyển
            </h3>
            {isLoadingShipping ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải phương thức vận chuyển...
              </div>
            ) : shippingMethods.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Chưa có phương thức vận chuyển nào.
              </div>
            ) : (
              <div className="space-y-3">
                {shippingMethods.map((method) => (
                  <label
                    key={method._id}
                    className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${selectedShippingMethod?._id === method._id ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-background hover:border-primary/50"}`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      checked={selectedShippingMethod?._id === method._id}
                      onChange={() => setSelectedShippingMethod(method)}
                      className="accent-primary mt-1"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-foreground text-sm">{method.name}</span>
                        <span className="font-bold text-primary text-sm">
                          +{method.baseFee.toLocaleString()}₫
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-between">
                        <span>
                          Thời gian giao:{" "}
                          <span className="font-semibold">{method.estimatedDays}</span>
                        </span>
                        {method.description && (
                          <span className="italic ml-2">{method.description}</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl bg-card p-5 shadow-[var(--shadow-card)] border">
            <h3 className="font-bold mb-4 text-base text-foreground">Phương thức thanh toán</h3>
            <div className="space-y-2 text-sm">
              {["Thanh toán khi nhận hàng (COD)", "Thanh toán qua VietQR", "Cổng VNPAY"].map(
                (method) => (
                  <label
                    key={method}
                    className="flex items-center gap-2.5 rounded-lg border p-3 cursor-pointer hover:border-primary bg-background transition-colors"
                  >
                    <input
                      type="radio"
                      name="pay"
                      checked={shippingInfo.paymentMethod === method}
                      onChange={() =>
                        setShippingInfo((prev) => ({ ...prev, paymentMethod: method }))
                      }
                      className="accent-primary"
                      disabled={isSubmitting}
                    />
                    <span className="font-medium text-foreground">{method}</span>
                  </label>
                ),
              )}
            </div>
          </section>
        </div>

        {/* KHỐI PHẢI: TÓM TẮT ĐƠN HÀNG THẬT & MÃ GIẢM GIÁ */}
        <aside className="lg:col-span-5 rounded-xl bg-card p-5 shadow-[var(--shadow-card)] border h-fit space-y-4">
          <h3 className="font-bold text-base text-foreground border-b pb-2">Đơn hàng của bạn</h3>

          {isLoadingCart ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Đang tính toán giá trị giỏ hàng ưu đãi...</span>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {cartItems.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground mb-2">
                    Không có sản phẩm nào trong giỏ hàng.
                  </p>
                  <Link to="/" className="text-xs text-primary font-bold underline">
                    Tiếp tục mua sắm
                  </Link>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 items-center text-xs bg-secondary/20 p-2 rounded-lg border"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-11 h-11 object-contain border rounded-md bg-white p-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate mb-1">
                        {item.variantName ? item.variantName : "Phiên bản tiêu chuẩn"}
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.variantId, -1)}
                          className="p-1 rounded bg-card border hover:bg-muted cursor-pointer"
                          disabled={isSubmitting}
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="font-bold font-mono text-[11px] min-w-[12px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.variantId, 1)}
                          className="p-1 rounded bg-card border hover:bg-muted cursor-pointer"
                          disabled={isSubmitting}
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className="font-semibold text-foreground">
                        {(item.price * item.quantity).toLocaleString()}₫
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* KHU VỰC TÍNH TIỀN */}
          <div className="space-y-1.5 border-t pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tạm tính giá gốc:</span>
              <span className="font-medium text-foreground font-mono">
                {orderTotal.toLocaleString()}₫
              </span>
            </div>
            {selectedShippingMethod && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển:</span>
                <span className="font-medium text-foreground font-mono">
                  +{selectedShippingMethod.baseFee.toLocaleString()}₫
                </span>
              </div>
            )}
            {appliedVoucher && (
              <div className="flex justify-between text-green-600 font-medium animate-fadeIn">
                <span>Giảm giá (Voucher):</span>
                <span className="font-mono">-{appliedVoucher.discountValue.toLocaleString()}₫</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-sm font-black">
              <span className="text-foreground">Tổng thanh toán:</span>
              <span className="text-primary text-base font-mono">
                {finalTotal.toLocaleString()}₫
              </span>
            </div>
          </div>

          {/* Ô NHẬP VOUCHER */}
          <div className="border-t pt-4 space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5 text-primary" /> Mã giảm giá / Coupon
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="VÍ DỤ: SHOPTECH100K"
                className="flex-1 rounded-lg border px-3 py-2 text-xs uppercase font-mono tracking-wider focus:outline-primary bg-background"
                disabled={isCheckingVoucher || isSubmitting}
              />
              <button
                type="button"
                onClick={() => handleApplyVoucher()}
                disabled={isCheckingVoucher || isSubmitting}
                className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                {isCheckingVoucher && <Loader2 className="w-3 h-3 animate-spin" />}
                Áp dụng
              </button>
            </div>

            {voucherError && (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 bg-red-50 p-2 rounded-lg border border-red-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {voucherError}
              </p>
            )}
            {voucherSuccess && (
              <p className="text-[11px] text-green-600 font-medium flex items-center gap-1 bg-green-50 p-2 rounded-lg border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {voucherSuccess}
              </p>
            )}

            {/* DANH SÁCH TAG VOUCHER */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1 tracking-wider">
                <Tag className="w-3.5 h-3.5 text-green-600" /> Ưu đãi có sẵn dành cho bạn
              </span>

              {isLoadingVouchers ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Đang tìm mã giảm giá
                  tốt nhất hệ thống...
                </div>
              ) : displayVouchers.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic py-1 bg-secondary/50 p-3 rounded-lg border border-dashed text-center">
                  Hiện không có chương trình ưu đãi nào công khai.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                  {displayVouchers.map((v) => {
                    let applicableTotal = orderTotal;
                    if (v.store) {
                      const vStoreId = typeof v.store === "object" ? v.store._id : v.store;
                      applicableTotal = cartItems
                        .filter((item) => item.storeId === vStoreId)
                        .reduce((sum, item) => sum + item.price * item.quantity, 0);
                    }
                    const isNotEnoughCondition = applicableTotal < v.minOrderValue;
                    const isSelected = appliedVoucher?.code === v.code;

                    return (
                      <div
                        key={v._id}
                        onClick={() => {
                          if (!isNotEnoughCondition && !isCheckingVoucher && !isSubmitting) {
                            handleApplyVoucher(v.code);
                          }
                        }}
                        className={`group relative border rounded-xl p-3 flex flex-col justify-between transition-all overflow-hidden ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm cursor-default"
                            : isNotEnoughCondition
                              ? "opacity-50 bg-muted/40 cursor-not-allowed border-dashed"
                              : "bg-card hover:border-foreground hover:shadow-sm cursor-pointer"
                        }`}
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/30 group-hover:bg-primary transition-colors" />

                        <div className="flex justify-between items-start gap-1">
                          <div className="space-y-0.5 pl-1.5">
                            <span className="font-mono font-bold text-xs uppercase tracking-wider text-foreground">
                              {v.code}
                            </span>
                            <p className="text-[11px] text-muted-foreground font-medium">
                              {v.description ||
                                `Giảm ${v.discountAmount.toLocaleString()}${v.discountType === "percent" ? "%" : "₫"} cho đơn hàng`}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-primary font-mono">
                              -{v.discountAmount.toLocaleString()}
                              {v.discountType === "percent" ? "%" : "₫"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-dashed pt-1.5 mt-2 pl-1.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Hạn:{" "}
                            {new Date(v.expirationDate).toLocaleDateString("vi-VN")}
                          </span>
                          {isNotEnoughCondition && (
                            <span className="text-red-500 font-medium flex items-center gap-0.5">
                              <Info className="w-3 h-3" /> Cần đơn từ{" "}
                              {v.minOrderValue.toLocaleString()}₫
                            </span>
                          )}
                          {!isNotEnoughCondition && !isSelected && (
                            <span className="text-green-600 font-bold text-[9px] uppercase tracking-wide bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                              Có thể dùng
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-primary font-bold text-[9px] uppercase tracking-wide bg-primary/10 px-1.5 py-0.5 rounded">
                              Đang chọn
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={cartItems.length === 0 || isLoadingCart || isSubmitting}
            className="w-full rounded-xl bg-foreground text-background py-3.5 font-bold hover:bg-foreground/90 transition-colors uppercase tracking-wider text-xs shadow-md mt-2 cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Đang xử lý đơn hàng..." : "Xác nhận đặt hàng ngay"}
          </button>
        </aside>
      </div>
    </>
  );
}
