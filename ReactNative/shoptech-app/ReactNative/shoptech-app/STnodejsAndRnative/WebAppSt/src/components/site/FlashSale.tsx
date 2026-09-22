import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Zap, Loader2 } from "lucide-react";
import { flashSaleService, IFlashSaleCampaign } from "@/lib/api/api-flash-sale";
import { productService } from "@/lib/api/api-product";
import { getImageUrl } from "@/lib/utils";

export function FlashSale() {
  const [activeCampaigns, setActiveCampaigns] = useState<IFlashSaleCampaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCampaigns = useCallback(async () => {
    try {
      const [data, productsData] = await Promise.all([
        flashSaleService.getAllCampaigns(),
        productService.getProducts({ isAvailable: true }),
      ]);
      const now = new Date().getTime();
      const validCampaigns = data.filter((c) => {
        const end = new Date(c.endTime).getTime();
        return c.isActive && end > now;
      });

      // Bổ sung dữ liệu sản phẩm cho các biến thể chỉ có ID (chưa được populate từ backend)
      validCampaigns.forEach((campaign) => {
        campaign.items.forEach((item: any) => {
          if (typeof item.variant === "string") {
            const variantId = item.variant;
            let foundProduct = null;
            let foundVariant = null;
            for (const p of productsData || []) {
              if (p.variants && Array.isArray(p.variants)) {
                const v = p.variants.find((v: any) => (v._id || v) === variantId);
                if (v) {
                  foundProduct = p;
                  foundVariant = v;
                  break;
                }
              }
            }
            if (foundProduct && foundVariant) {
              item.variant = {
                _id: variantId,
                price: foundVariant.price,
                attributes: foundVariant.attributes,
                product: {
                  _id: foundProduct._id,
                  name: foundProduct.name,
                  images: foundProduct.images,
                },
              };
            }
          }
        });
      });

      // Sắp xếp ưu tiên: Đang chạy trước, Sắp chạy sau
      validCampaigns.sort((a, b) => {
        const aStart = new Date(a.startTime).getTime();
        const bStart = new Date(b.startTime).getTime();
        const aRunning = aStart <= now;
        const bRunning = bStart <= now;
        if (aRunning && !bRunning) return -1;
        if (!aRunning && bRunning) return 1;
        return aStart - bStart;
      });

      setActiveCampaigns(validCampaigns);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu Flash Sale tại Trang chủ:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchCampaigns();
  }, [fetchCampaigns]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-red-600" />
      </div>
    );
  }

  if (activeCampaigns.length === 0) {
    return null;
  }

  return (
    <>
      {activeCampaigns.map((campaign) => (
        <FlashSaleBlock key={campaign._id} campaign={campaign} onRefresh={fetchCampaigns} />
      ))}
    </>
  );
}

function FlashSaleBlock({
  campaign,
  onRefresh,
}: {
  campaign: IFlashSaleCampaign;
  onRefresh: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (!campaign) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(campaign.startTime).getTime();
      const end = new Date(campaign.endTime).getTime();

      if (now < start) return Math.max(0, Math.floor((start - now) / 1000));
      if (now >= start && now <= end) return Math.max(0, Math.floor((end - now) / 1000));
      return 0;
    };

    const initialTimeLeft = calculateTimeLeft();
    setSecondsLeft(initialTimeLeft);

    if (initialTimeLeft === 0) {
      onRefresh();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onRefresh();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [campaign, onRefresh]);

  const formatTime = (totalSeconds: number) => {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return { h, m, s };
  };

  const timerDisplay = formatTime(secondsLeft);
  const isUpcoming = new Date(campaign.startTime) > new Date();

  if (secondsLeft === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-card)] border">
        {/* BANNER THANH TIÊU ĐỀ KHỐI FLASH SALE */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 text-white bg-gradient-to-r from-red-600 to-orange-500">
          <Link to="/flash-sale" className="flex items-center gap-2 hover:opacity-90">
            <Zap className="h-5 w-5 fill-white stroke-none animate-pulse" />
            <h2 className="text-sm md:text-base font-black uppercase tracking-wide">
              {campaign.campaignName}
            </h2>
          </Link>

          {/* ĐỒNG HỒ ĐẾM NGƯỢC */}
          <div className="flex items-center gap-2 text-xs">
            <span className="hidden sm:inline font-medium opacity-90">
              {isUpcoming ? "Bắt đầu sau" : "Kết thúc sau"}
            </span>
            <div className="flex items-center gap-1 font-mono font-bold">
              <span className="rounded bg-black/30 px-2 py-1">{timerDisplay.h}</span>:
              <span className="rounded bg-black/30 px-2 py-1">{timerDisplay.m}</span>:
              <span className="rounded bg-black/30 px-2 py-1">{timerDisplay.s}</span>
            </div>
            <Link
              to="/flash-sale"
              className="ml-2 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold hover:bg-white/30 uppercase tracking-wider"
            >
              Xem tất cả
            </Link>
          </div>
        </div>

        {/* LƯỚI HIỂN THỊ TỐI ĐA 5 SẢN PHẨM Ở TRANG CHỦ */}
        <div className="bg-card p-3">
          {campaign.items.filter(
            (item: any) => typeof item.variant === "object" && item.variant !== null,
          ).length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground italic border-t">
              Chiến dịch này chưa có sản phẩm hợp lệ để hiển thị.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {campaign.items
                .filter((item: any) => typeof item.variant === "object" && item.variant !== null)
                .slice(0, 5)
                .map((item: any, i: number) => {
                  const variantData = typeof item.variant === "object" ? item.variant : null;
                  const productName =
                    variantData?.product?.name || item.productName || "Sản phẩm Flash Sale";
                  const variantSpecs = variantData?.attributes
                    ? Object.values(variantData.attributes).join(" / ")
                    : "";

                  const productImages = variantData?.product?.images || item.product?.images || [];
                  const rawImage =
                    variantData?.imageUrl ||
                    variantData?.image ||
                    (productImages.length > 0 ? productImages[0] : null);
                  const productImage = rawImage
                    ? getImageUrl(rawImage)
                    : "https://placehold.co/300x300?text=ShopTech";

                  const originalPrice = variantData?.price || item.salePrice * 1.25;

                  const percentSold = Math.round((item.soldCount / item.quantityLimit) * 100);
                  const isOutofStock = item.soldCount >= item.quantityLimit;
                  const discountPercent = Math.round(
                    ((originalPrice - item.salePrice) / originalPrice) * 100,
                  );

                  // 🎯 BẢN VÁ LỖI QUAN TRỌNG: Trích xuất chuẩn ID sản phẩm cha, tuyệt đối không lấy nhầm ID Variant bừa bãi
                  const targetProductId =
                    variantData?.product?._id ||
                    variantData?.product ||
                    item.product?._id ||
                    item.product ||
                    item.productId;

                  return (
                    <Link
                      key={i}
                      to="/product/$id"
                      params={{ id: targetProductId || "default" }}
                      className="group bg-background rounded-xl border p-2.5 flex flex-col justify-between relative hover:shadow-sm transition-all"
                    >
                      {/* Nhãn % giảm giá */}
                      {discountPercent > 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-red-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded z-10 flex items-center gap-0.5">
                          -{discountPercent}%
                        </div>
                      )}

                      {/* Ảnh bọc ngoài */}
                      <div className="h-28 bg-white flex items-center justify-center rounded-lg overflow-hidden p-1 relative">
                        <img
                          src={productImage}
                          alt={productName}
                          className="object-contain h-full w-full group-hover:scale-105 transition-transform"
                        />
                        {isOutofStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-[9px] uppercase">
                            Hết suất
                          </div>
                        )}
                      </div>

                      {/* Thông tin chữ & Thanh Progress Bar */}
                      <div className="mt-2 space-y-1.5">
                        <h3 className="font-bold text-[11px] text-foreground line-clamp-1 group-hover:text-red-600 transition-colors">
                          {productName}{" "}
                          <span className="text-muted-foreground font-normal text-[10px]">
                            {variantSpecs && `(${variantSpecs})`}
                          </span>
                        </h3>

                        <div className="flex items-baseline gap-1.5 font-mono">
                          <span className="text-xs font-black text-red-600">
                            {item.salePrice.toLocaleString()}₫
                          </span>
                          <span className="text-[9px] text-muted-foreground line-through opacity-70">
                            {originalPrice.toLocaleString()}₫
                          </span>
                        </div>

                        {/* Thanh số lượng mini dưới chân card */}
                        <div className="relative w-full h-2.5 bg-orange-100 rounded-full overflow-hidden border border-orange-200">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full"
                            style={{ width: `${Math.min(100, percentSold)}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center font-bold text-[7px] text-orange-950 uppercase">
                            {isOutofStock ? "HẾT SẢN PHẨM" : `Vừa bán ${item.soldCount}`}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
