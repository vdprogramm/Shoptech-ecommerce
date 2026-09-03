import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";
import { flashSaleService, IFlashSaleCampaign } from "@/lib/api/api-flash-sale";
import { productService } from "@/lib/api/api-product";
import { Zap, Clock, Flame, ShoppingCart, Loader2 } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

export const Route = createFileRoute("/_site/flash-sale")({
  component: FlashSaleComponent,
});

function FlashSaleComponent() {
  const [activeCampaigns, setActiveCampaigns] = useState<IFlashSaleCampaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
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
                imageUrl: foundVariant.imageUrl || foundVariant.image || (foundProduct.images?.length > 0 ? foundProduct.images[0] : null)
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
      console.error("Lỗi lấy dữ liệu Flash Sale:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: "Trang chủ", to: "/" }, { label: "Flash Sale" }]} />

      <div className="container mx-auto px-4 pb-12 space-y-12">
        {activeCampaigns.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-16 border border-dashed rounded-2xl bg-card shadow-sm">
            Hiện không có chương trình Flash Sale nào đang chạy hoặc sắp diễn ra.
          </div>
        ) : (
          activeCampaigns.map((campaign) => (
            <FlashSaleCampaignBlock key={campaign._id} campaign={campaign} onRefresh={fetchCampaigns} />
          ))
        )}
      </div>
    </>
  );
}

function FlashSaleCampaignBlock({ campaign, onRefresh }: { campaign: IFlashSaleCampaign, onRefresh: () => void }) {
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

  if (secondsLeft === 0) return null;

  return (
    <div className="flash-sale-campaign-wrapper">
      {/* BANNER THỜI GIAN VÀ ĐỒNG HỒ ĐẾM NGƯỢC */}
      <div className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 p-5 shadow-sm text-white flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 fill-white stroke-none animate-bounce" />
          <div>
            <h2 className="text-xl font-black uppercase tracking-wider">
              ⚡ {campaign.campaignName}
            </h2>
            <p className="text-[11px] text-white/80">Sắp xếp tự động bởi hệ thống ShopTech</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono">
          <span className="font-sans text-orange-200 font-bold">
            {isUpcoming ? "Bắt đầu sau:" : "Kết thúc sau:"}
          </span>
          <span className="bg-white text-black font-bold px-1.5 py-0.5 rounded shadow-sm">
            {timerDisplay.h}
          </span>
          :
          <span className="bg-white text-black font-bold px-1.5 py-0.5 rounded shadow-sm">
            {timerDisplay.m}
          </span>
          :
          <span className="bg-white text-black font-bold px-1.5 py-0.5 rounded shadow-sm">
            {timerDisplay.s}
          </span>
        </div>
      </div>

      {/* LƯỚI SẢN PHẨM GIỜ VÀNG */}
      {campaign.items.filter((i: any) => typeof i.variant === "object" && i.variant !== null).length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-8 border border-dashed rounded-xl bg-card">
          Chiến dịch này chưa có sản phẩm.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {campaign.items
            .filter((i: any) => typeof i.variant === "object" && i.variant !== null)
            .map((item: any, i) => {
              const variantData = typeof item.variant === "object" ? item.variant : null;
              const productName = variantData?.product?.name || "Sản phẩm Flash Sale";
              const variantSpecs = variantData?.attributes
                ? Object.values(variantData.attributes).join(" / ")
                : "";

              const productImage = variantData?.imageUrl || "https://placehold.co/300x300?text=ShopTech";
              const originalPrice = variantData?.price || item.salePrice * 1.25;

              const percentSold = Math.round((item.soldCount / item.quantityLimit) * 100);
              const isOutofStock = item.soldCount >= item.quantityLimit;
              const discountPercent = Math.round(
                ((originalPrice - item.salePrice) / originalPrice) * 100,
              );
              
              const targetProductId = variantData?.product?._id || variantData?.product || item.productId || "default";

              return (
                <div
                  key={i}
                  className="group bg-card rounded-xl border p-3 flex flex-col justify-between relative hover:shadow-md transition-all duration-200"
                >
                  {/* Nhãn % Giảm giá góc trái */}
                  {discountPercent > 0 && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded z-10 flex items-center gap-0.5 uppercase tracking-wider">
                      <Flame className="w-2.5 h-2.5 fill-white" />-{discountPercent}%
                    </div>
                  )}

                  {/* Khu vực hiển thị ảnh biến thể sản phẩm */}
                  <Link to="/product/$id" params={{ id: targetProductId }} className="block h-36 bg-white flex items-center justify-center rounded-lg overflow-hidden p-2 relative">
                    <img
                      src={getImageUrl(productImage)}
                      alt={productName}
                      className="object-contain h-full w-full group-hover:scale-105 transition-transform duration-300"
                    />
                    {isOutofStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-[10px] uppercase tracking-wider backdrop-blur-[1px]">
                        Hết suất giá sốc
                      </div>
                    )}
                  </Link>

                  {/* Khu vực thông tin chi tiết & Giá cả */}
                  <div className="mt-3 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <Link to="/product/$id" params={{ id: targetProductId }}>
                        <h3 className="font-bold text-xs text-foreground line-clamp-2 min-h-[32px] group-hover:text-red-600 transition-colors">
                          {productName}{" "}
                          {variantSpecs && (
                            <span className="text-muted-foreground font-normal text-[11px]">
                              ({variantSpecs})
                            </span>
                          )}
                        </h3>
                      </Link>
                      <div className="flex flex-col font-mono mt-1">
                        <span className="text-sm font-black text-red-600">
                          {item.salePrice.toLocaleString()}₫
                        </span>
                        <span className="text-[10px] text-muted-foreground line-through opacity-70">
                          {originalPrice.toLocaleString()}₫
                        </span>
                      </div>
                    </div>

                    {/* THANH TIẾN ĐỘ SỐ LƯỢNG */}
                    <div className="space-y-1">
                      <div className="relative w-full h-3.5 bg-orange-100 rounded-full overflow-hidden border border-orange-200">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, percentSold)}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center font-bold text-[8px] text-orange-950 uppercase tracking-wide">
                          {isOutofStock
                            ? "BÁN HẾT"
                            : `ĐÃ BÁN ${item.soldCount}/${item.quantityLimit}`}
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/product/$id"
                      params={{ id: targetProductId }}
                      disabled={!!isOutofStock || !!isUpcoming}
                      className={`w-full py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-1 transition-colors ${
                        isOutofStock
                          ? "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                          : isUpcoming
                            ? "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
                            : "bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                      }`}
                    >
                      <ShoppingCart className="w-3 h-3" />
                      {isUpcoming ? "Sắp mở bán" : "Săn ngay kẻo lỡ"}
                    </Link>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
