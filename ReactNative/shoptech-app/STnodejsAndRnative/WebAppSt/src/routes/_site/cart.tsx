import { useConfirm } from "@/hooks/use-confirm";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Breadcrumb, PageHeader } from "@/components/site/PageHeader";
import { Trash2, Minus, Plus, Loader2 } from "lucide-react";
import { cartService, type CartItem } from "@/lib/api/api-cart";
import { flashSaleService } from "@/lib/api/api-flash-sale";
import { getImageUrl } from "@/lib/utils";

export const Route = createFileRoute("/_site/cart")({
  component: CartPage,
});

function CartPage() {
  const { confirm } = useConfirm();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const applyFlashSalePrices = async (cartItems: any[]) => {
    const validItems = cartItems.filter(
      (item: any) => item && item.variant !== null && item.variant !== undefined,
    );

    try {
      const campaigns = await flashSaleService.getAllCampaigns();
      const now = new Date().getTime();
      const activeCampaigns = campaigns.filter(
        (c) => c.isActive && new Date(c.endTime).getTime() > now,
      );

      // Tạo map các biến thể đang được giảm giá từ tất cả các chiến dịch đang chạy
      const flashSaleMap = new Map();
      activeCampaigns.forEach((campaign: any) => {
        if (campaign.items) {
          campaign.items.forEach((saleItem: any) => {
            const variantId =
              typeof saleItem.variant === "object" ? saleItem.variant._id : saleItem.variant;
            flashSaleMap.set(variantId, saleItem);
          });
        }
      });

      return validItems.map((item: any) => {
        const flashItem = flashSaleMap.get(item.variant._id);

        if (flashItem) {
          return {
            ...item,
            variant: {
              ...item.variant,
              price: flashItem.salePrice,
              originalPrice: item.variant.price, // Giá cũ là giá đang lưu trong giỏ hàng
              isFlashSale: true,
            },
          };
        }
        return item;
      });
    } catch (err) {
      console.error("Lỗi lấy thông tin flash sale cho giỏ hàng:", err);
      return validItems;
    }
  };

  const fetchCartData = async () => {
    try {
      setIsLoading(true);
      const data = await cartService.getCart();
      if (data && data.items) {
        const itemsWithFlashSale = await applyFlashSalePrices(data.items);
        setItems(itemsWithFlashSale);
      }
    } catch (err) {
      console.error("Lỗi đồng bộ giỏ hàng từ server:", err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCartData();
  }, []);

  const total = items.reduce((s, i) => s + (i.variant?.price || 0) * i.quantity, 0);
  const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";

  // Sửa hàm handleUpdateQty
  const handleUpdateQty = async (
    variantId: string,
    currentQty: number,
    delta: number,
    stock: number,
  ) => {
    const newQty = currentQty + delta;
    if (newQty < 1 || newQty > stock) return;

    try {
      // Ép kiểu dữ liệu trả về là CartData
      const updatedData = await cartService.updateQuantity(variantId, newQty);

      if (updatedData && updatedData.items) {
        const itemsWithFlashSale = await applyFlashSalePrices(updatedData.items);
        setItems(itemsWithFlashSale);
      }
    } catch (err) {
      console.error("Cập nhật số lượng thất bại:", err);
    }
  };

  // 2. Hàm xử lý xóa sản phẩm khỏi giỏ ở FE
  const handleRemoveItem = async (variantId: string) => {
    if (!(await confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?"))) return;
    try {
      const updatedData = await cartService.removeItem(variantId);

      if (updatedData && updatedData.items) {
        const itemsWithFlashSale = await applyFlashSalePrices(updatedData.items);
        setItems(itemsWithFlashSale); // 🎯 Cập nhật State sạch từ server trả về
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Xóa sản phẩm thất bại:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center gap-2 text-card-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-medium animate-pulse">
          Đang kết nối giỏ hàng trực tuyến...
        </span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Breadcrumb items={[{ label: "Giỏ hàng" }]} />
        <PageHeader title="Giỏ hàng" subtitle="0 sản phẩm" />
        <div className="container mx-auto px-4 text-center py-20 border rounded-2xl bg-card text-card-foreground">
          <p className="text-sm text-muted-foreground mb-4">Giỏ hàng của bạn đang trống.</p>
          <Link
            to="/"
            className="inline-block rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
          >
            Quay lại trang chủ mua sắm
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: "Giỏ hàng" }]} />
      <PageHeader title="Giỏ hàng" subtitle={`${items.length} sản phẩm`} />

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 pb-10 text-card-foreground">
        <div className="space-y-3">
          {items.map((it) => {
            if (!it.variant) return null;

            const productImages = it.variant.product?.images || [];
            const displayImage =
              it.variant.imageUrl ||
              (it.variant.images && it.variant.images.length > 0 ? it.variant.images[0] : null) ||
              (productImages.length > 0 ? productImages[0] : null) ||
              "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500";

            return (
              <div
                key={it.variant._id}
                className="flex flex-col sm:flex-row gap-4 p-4 border-b last:border-0 relative rounded-xl bg-card shadow-[var(--shadow-card)] border"
              >
                <img
                  src={getImageUrl(displayImage)}
                  alt={it.variant.name}
                  className="h-24 w-24 object-contain bg-white rounded-lg p-1 border shrink-0"
                />
                <div className="flex-1 space-y-1 min-w-0">
                  <Link
                    to="/product/$id"
                    params={{ id: it.variant.product || it.variant._id }}
                    className="font-bold hover:text-primary line-clamp-2 text-sm text-foreground leading-tight"
                  >
                    {it.variant.name}
                  </Link>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-primary font-extrabold text-sm">
                      {fmt(it.variant.price)}
                    </span>

                    {(it.variant as any).isFlashSale && (
                      <span className="text-xs text-muted-foreground line-through opacity-70">
                        {fmt((it.variant as any).originalPrice)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-lg border bg-secondary overflow-hidden">
                      <button
                        onClick={() =>
                          handleUpdateQty(it.variant._id, it.quantity, -1, it.variant.stock)
                        }
                        className="p-1.5 hover:bg-muted text-muted-foreground cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 text-center text-xs font-bold text-foreground">
                        {it.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQty(it.variant._id, it.quantity, 1, it.variant.stock)
                        }
                        className="p-1.5 hover:bg-muted text-muted-foreground cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(it.variant._id)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="rounded-xl bg-card p-4 shadow-[var(--shadow-card)] border h-fit">
          <h2 className="font-bold text-sm border-b pb-2 mb-3 text-foreground">Tóm tắt đơn hàng</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Tạm tính</span>
              <span className="font-semibold text-foreground">{fmt(total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Vận chuyển</span>
              <span className="text-green-600 font-bold">Miễn phí</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-black text-sm">
              <span>Tổng cộng</span>
              <span className="text-xl text-[#D70018]">{fmt(total)}</span>
            </div>
          </div>

          <input
            placeholder="Nhập mã giảm giá"
            className="mt-3 w-full rounded-lg border px-3 py-2 text-xs bg-secondary focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <Link
            to="/checkout"
            className="mt-3 block rounded-xl bg-primary py-3 text-center font-bold text-xs text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            Đặt hàng ngay
          </Link>
          <Link
            to="/"
            className="mt-2 block text-center text-xs text-muted-foreground hover:text-primary transition"
          >
            Tiếp tục mua sắm
          </Link>
        </aside>
      </div>
    </>
  );
}
