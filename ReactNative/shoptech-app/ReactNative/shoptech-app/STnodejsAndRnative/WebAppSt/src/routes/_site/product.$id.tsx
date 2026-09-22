import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Breadcrumb } from "@/components/site/PageHeader";
import {
  Star,
  ShoppingCart,
  Shield,
  Truck,
  RotateCcw,
  Loader2,
  Cpu,
  Calendar,
  Tag,
  Flame,
  Timer,
} from "lucide-react";
import { ProductSection } from "@/components/site/ProductSection";
import {
  productService,
  type Product,
  type IProductSpec,
  type IProductVariant,
} from "@/lib/api/api-product";
import { cartService } from "@/lib/api/api-cart";
// 🎯 ĐỒNG BỘ: Sử dụng hàm lấy Flash Sale theo cấu trúc mảng biến thể mới từ flashSaleService
import { flashSaleService, type IProductFlashSaleResponse } from "@/lib/api/api-flash-sale";
import { getImageUrl } from "@/lib/utils";
import { ProductReviews } from "@/components/site/ProductReviews";
import { storeService, type IStore } from "@/lib/api/api-store";
import { StoreProfileSection } from "@/components/site/StoreProfileSection";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

function ProductNotFound() {
  return (
    <div className="container mx-auto p-10 text-center text-card-foreground">
      Sản phẩm hoặc chương trình Flash Sale này không tồn tại hoặc đã kết thúc.{" "}
      <Link to="/" className="text-primary underline">
        Về trang chủ
      </Link>
    </div>
  );
}

export const Route = createFileRoute("/_site/product/$id")({
  component: ProductPage,
  notFoundComponent: ProductNotFound,
});

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  // 1. Quản lý trạng thái dữ liệu chính từ API NestJS
  const [p, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<IProductVariant[]>([]);
  const [specs, setSpecs] = useState<IProductSpec[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<IStore | null>(null);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [totalStoreProducts, setTotalStoreProducts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Trạng thái ma trận lọc cấu hình biến thể
  const [attributesGroup, setAttributesGroup] = useState<Record<string, string[]>>({});
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [activeVariant, setActiveVariant] = useState<IProductVariant | null>(null);

  // 🎯 3. Lưu trữ thô phản hồi Flash Sale từ API NestJS phục vụ cho việc tính toán động
  const [rawFlashSale, setRawFlashSale] = useState<IProductFlashSaleResponse | null>(null);

  // Trạng thái Flash Sale được áp dụng sau khi lọc theo biến thể đang hoạt động
  const [flashSale, setFlashSale] = useState<{
    isAvailable: boolean;
    salePrice: number;
    originalPrice: number;
    soldCount: number;
    limitStock: number;
    endDate: Date;
  } | null>(null);

  // 🕒 4. Trạng thái đếm ngược thời gian thực (Countdown Timer)
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // EFFECT 1: Truy vấn tài nguyên cốt lõi từ API Gateway khi ID trình duyệt thay đổi
  useEffect(() => {
    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    if (!id || id === "default" || id === "undefined" || !isValidMongoId) {
      const fetchDefaultProduct = async () => {
        try {
          setIsLoading(true);
          const response = await productService.getProducts({});
          if (response && response.length > 0) {
            navigate({ to: `/product/${response[0]._id}` });
          } else {
            setProduct(null);
            setIsLoading(false);
          }
        } catch (e) {
          setProduct(null);
          setIsLoading(false);
        }
      };
      fetchDefaultProduct();
      return;
    }

    const fetchAllProductData = async () => {
      try {
        setIsLoading(true);
        let targetProductId = id;
        let detailData: Product | null = null;
        let saleSourceVariant: IProductVariant | null = null;

        // TẦNG 1: Tìm kiếm sản phẩm chính
        try {
          detailData = await productService.getProductById(id);
        } catch (e) {
          console.warn("ID không thuộc Product gốc. Kiểm tra liên kết biến thể...");
        }

        // TẦNG 2: Xử lý dự phòng ngược nếu ID truyền vào là một Variant ID cụ thể
        try {
          const fallbackVariants = await productService.getProductVariants(id);
          if (fallbackVariants && fallbackVariants.length > 0) {
            saleSourceVariant = fallbackVariants.find((v) => v._id === id) || fallbackVariants[0];
            if (saleSourceVariant) {
              const parentProduct = saleSourceVariant.product as any;
              const parentId =
                typeof parentProduct === "object" && parentProduct !== null
                  ? parentProduct?._id
                  : parentProduct;
              if (parentId) {
                targetProductId = parentId;
                if (!detailData) {
                  detailData = await productService.getProductById(parentId);
                }
              }
            }
          }
        } catch (errVariant) {
          console.error("Lỗi trích xuất quan hệ biến thể:", errVariant);
        }

        if (!detailData) {
          setProduct(null);
          return;
        }
        setProduct(detailData);

        // Đồng bộ danh mục biến thể
        let finalVariants: IProductVariant[] = [];
        try {
          finalVariants = await productService.getProductVariants(targetProductId);
          setVariants(finalVariants || []);
        } catch (e) {
          setVariants([]);
        }

        // 🎯 TẦNG 3: Tự lọc Flash Sale từ danh sách tất cả các chiến dịch vì backend chỉ hỗ trợ 1 chiến dịch
        try {
          const campaigns = await flashSaleService.getAllCampaigns();
          const now = new Date().getTime();
          const activeCampaigns = campaigns.filter(
            (c) => c.isActive && new Date(c.endTime).getTime() > now,
          );

          let foundCampaign = null;
          let saleItems: any[] = [];

          for (const camp of activeCampaigns) {
            const matchedItems = camp.items.filter((item: any) => {
              const varId =
                typeof item.variant === "string" ? item.variant : item.variant?._id || item.variant;
              return finalVariants.some((v) => v._id === varId);
            });

            if (matchedItems.length > 0) {
              foundCampaign = camp;
              saleItems = matchedItems.map((item: any) => {
                const varId =
                  typeof item.variant === "string"
                    ? item.variant
                    : item.variant?._id || item.variant;
                const originalVar = finalVariants.find((v) => v._id === varId);
                return {
                  variantId: varId,
                  salePrice: item.salePrice,
                  originalPrice: originalVar?.price || 0,
                  soldCount: item.soldCount,
                  limitStock: item.quantityLimit,
                };
              });
              break;
            }
          }

          if (foundCampaign) {
            setRawFlashSale({
              isFlashSale: true,
              campaignId: foundCampaign._id,
              campaignName: foundCampaign.campaignName,
              endTime: foundCampaign.endTime,
              saleItems: saleItems,
            });
          } else {
            setRawFlashSale({
              isFlashSale: false,
              campaignId: null,
              endTime: null,
              saleItems: [],
            });
          }
        } catch (fsErr) {
          setRawFlashSale(null);
        }

        // Tải các thông tin phụ trợ bổ sung
        try {
          const specData = await productService.getProductAttributes(targetProductId);
          setSpecs(specData || []);
        } catch (e) {
          setSpecs([]);
        }

        try {
          const reviewData = await productService.getProductReviews(targetProductId);
          setReviews(reviewData || []);
        } catch (e) {
          setReviews([]);
        }

        if (detailData.category) {
          try {
            const catId =
              typeof detailData.category === "object"
                ? (detailData.category as any)._id
                : detailData.category;
            const related = await productService.getProducts({ category: catId });
            setSimilarProducts(related.filter((x) => x._id !== detailData?._id).slice(0, 5));
          } catch (e) {
            setSimilarProducts([]);
          }
        }

        if (detailData.store) {
          try {
            let rawStore = detailData.store;
            if (Array.isArray(rawStore)) {
              rawStore = rawStore[0];
            }
            const storeId =
              typeof rawStore === "object" && rawStore !== null
                ? (rawStore as any)._id || (rawStore as any).id
                : rawStore;

            // Validate Store ID là một Mongo ObjectID hợp lệ (24 ký tự hex)
            const isValidStoreId = /^[0-9a-fA-F]{24}$/.test(storeId);

            if (isValidStoreId) {
              const storeData = await storeService.getStoreById(storeId);
              setStore(storeData);

              const relatedStoreProducts = await productService.getProducts({ store: storeId });
              setTotalStoreProducts(relatedStoreProducts.length);
              setStoreProducts(
                relatedStoreProducts.filter((x) => x._id !== detailData?._id).slice(0, 5),
              );
            } else {
              console.warn("Store ID đính kèm trên sản phẩm không hợp lệ:", storeId);
            }
          } catch (e) {
            console.error("Lỗi lấy thông tin cửa hàng", e);
          }
        }
      } catch (err) {
        console.error("Lỗi kết nối nghiêm trọng tới cổng dữ liệu ShopTech:", err);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllProductData();
  }, [id, navigate]);

  // EFFECT 2: Đồng bộ cấu hình ma trận thuộc tính phẳng từ danh sách biến thể
  useEffect(() => {
    if (!variants || variants.length === 0) {
      setAttributesGroup({});
      setSelectedAttributes({});
      return;
    }

    const groups: Record<string, Set<string>> = {};
    const initialSelected: Record<string, string> = {};

    variants.forEach((v) => {
      if (v.attributes && Object.keys(v.attributes).length > 0) {
        Object.entries(v.attributes).forEach(([key, value]) => {
          if (!groups[key]) groups[key] = new Set();
          groups[key].add(value);
        });
      } else if (v.sku && v.sku.includes("-")) {
        const parts = v.sku.split("-").map((p) => p.trim());
        if (parts[0]) {
          if (!groups["Màu sắc"]) groups["Màu sắc"] = new Set();
          groups["Màu sắc"].add(parts[0]);
        }
        if (parts[1]) {
          if (!groups["Dung lượng"]) groups["Dung lượng"] = new Set();
          groups["Dung lượng"].add(parts[1]);
        }
      }
    });

    const formattedGroups: Record<string, string[]> = {};
    Object.keys(groups).forEach((key) => {
      formattedGroups[key] = Array.from(groups[key]);
      initialSelected[key] = formattedGroups[key][0];
    });

    setAttributesGroup(formattedGroups);
    setSelectedAttributes(initialSelected);
  }, [variants]);

  // EFFECT 3: Xác định biến thể đang chọn (`activeVariant`) dựa trên nút bấm thuộc tính và ưu tiên Flash Sale
  useEffect(() => {
    if (!variants || variants.length === 0) {
      setActiveVariant(null);
      return;
    }

    // Bước A: Kiểm tra xem URL có trùng khớp chính xác với ID biến thể nào không
    const exactIdMatch = variants.find((v) => v._id === id);
    if (exactIdMatch) {
      setActiveVariant(exactIdMatch);
      return;
    }

    // Bước B: ƯU TIÊN CAO NHẤT - Nếu có dữ liệu Flash Sale thô, tìm biến thể đang được giảm giá để kích hoạt trước
    if (rawFlashSale && rawFlashSale.isFlashSale && rawFlashSale.saleItems?.length > 0) {
      // Lấy ID biến thể đầu tiên có trong danh sách giảm giá của chiến dịch
      const flashSaleVariantId = rawFlashSale.saleItems[0].variantId;
      const flashSaleVariant = variants.find((v) => v._id === flashSaleVariantId);

      if (flashSaleVariant) {
        setActiveVariant(flashSaleVariant);
        // Đồng bộ ngược lại các nút bấm thuộc tính giao diện (Màu sắc, Dung lượng) theo biến thể Sale này
        if (flashSaleVariant.attributes) {
          setSelectedAttributes(flashSaleVariant.attributes);
        }
        return; // Thoát sớm, ưu tiên hiển thị Flash Sale
      }
    }

    // Bước C: Dự phòng nếu không có Flash Sale, tìm theo ma trận nút bấm người dùng chọn
    const match = variants.find((v) => {
      if (v.attributes && Object.keys(v.attributes).length > 0) {
        return Object.entries(selectedAttributes).every(
          ([key, value]) => v.attributes[key] === value,
        );
      }
      if (v.sku && v.sku.includes("-")) {
        const parts = v.sku.split("-").map((p) => p.trim());
        return (
          selectedAttributes["Màu sắc"] === parts[0] &&
          selectedAttributes["Dung lượng"] === parts[1]
        );
      }
      return false;
    });

    setActiveVariant(match || variants[0]);
  }, [selectedAttributes, variants, id, rawFlashSale]); // <--- Bổ sung thêm rawFlashSale để lắng nghe dữ liệu từ Backend

  // 🔥 EFFECT MỚI (QUAN TRỌNG): Lọc dữ liệu Flash Sale động dựa trên biến thể đang hoạt động (`activeVariant`)
  useEffect(() => {
    if (!rawFlashSale || !rawFlashSale.isFlashSale || !activeVariant) {
      setFlashSale(null);
      return;
    }

    // Tiến hành dò tìm ID biến thể đang active xem có nằm trong mảng phân phối giảm giá không
    const matchedItem = rawFlashSale.saleItems.find((item) => item.variantId === activeVariant._id);

    if (matchedItem) {
      setFlashSale({
        isAvailable: true,
        salePrice: matchedItem.salePrice,
        originalPrice: matchedItem.originalPrice || activeVariant.price,
        soldCount: matchedItem.soldCount,
        limitStock: matchedItem.limitStock,
        endDate: rawFlashSale.endTime
          ? new Date(rawFlashSale.endTime)
          : new Date(Date.now() + 4 * 60 * 60 * 1000),
      });
    } else {
      // Nếu biến thể được chọn không nằm trong danh mục ưu đãi, trả về giá thường một cách mượt mà
      setFlashSale(null);
    }
  }, [activeVariant, rawFlashSale]);

  // EFFECT 5: Thực thi bộ đếm ngược thời gian thực từng giây
  useEffect(() => {
    if (!flashSale || !flashSale.isAvailable) return;

    const calculateTimeLeft = () => {
      const difference = +flashSale.endDate - +new Date();
      let timeLeftData = { hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        timeLeftData = {
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      setTimeLeft(timeLeftData);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [flashSale]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3 text-card-foreground">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-medium animate-pulse">
          Đang đồng bộ cổng dữ liệu Flash Sale ShopTech...
        </span>
      </div>
    );
  }

  if (!p) return <ProductNotFound />;

  // 🎯 LUỒNG ƯU TIÊN GIÁ CỦA SHOPTECH:
  // 1. Nếu biến thể hiện tại có Flash Sale -> Hiển thị giá sale và giá gốc của biến thể đó.
  // 2. Nếu không có Flash Sale -> Hiển thị giá thường của biến thể.
  // 3. Dự phòng cuối cùng -> Giá mặc định của sản phẩm cha.
  const currentPrice = flashSale?.isAvailable
    ? flashSale.salePrice
    : activeVariant
      ? activeVariant.price
      : p.price;

  const originalPrice = flashSale?.isAvailable
    ? flashSale.originalPrice
    : activeVariant
      ? activeVariant.price
      : p.originalPrice || p.price;
  const currentStock = activeVariant ? activeVariant.stock : p.stock;

  const displayImage =
    activeVariant && activeVariant.imageUrl
      ? activeVariant.imageUrl
      : p.images?.[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500";
  const brandName = p.brand && typeof p.brand === "object" ? (p.brand as any).name : "Chính hãng";
  const soldPercent = flashSale
    ? Math.min(Math.round((flashSale.soldCount / flashSale.limitStock) * 100), 100)
    : 0;

  const handleSelectOption = (groupName: string, value: string) => {
    const newAttributes = { ...selectedAttributes, [groupName]: value };
    setSelectedAttributes(newAttributes);

    // Tìm ngay lập tức biến thể khớp với cấu hình vừa bấm để cập nhật giao diện không bị trễ state
    const match = variants.find((v) => {
      if (v.attributes) {
        return Object.entries(newAttributes).every(([k, val]) => v.attributes[k] === val);
      }
      return false;
    });
    if (match) setActiveVariant(match);
  };

  const handleAddToCartFlow = async (shouldRedirect = false) => {
    const targetVariantId = activeVariant?._id || (variants.length > 0 ? variants[0]._id : null);
    if (!targetVariantId) {
      toast.error("Sản phẩm chưa có biến thể bán hàng!");
      return;
    }
    try {
      await cartService.addToCart(targetVariantId, 1);
      if (shouldRedirect) navigate({ to: "/checkout" });
      else showSuccessModal(`Đã thêm ${p.name} vào giỏ hàng thành công!`);
    } catch (err) {
      toast.error("Vui lòng đăng nhập hệ thống trước khi mua hàng!");
    }
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Sản phẩm", to: "/" }, { label: p.name }]} />

      {/* BANNER HIỂN THỊ CHIẾN DỊCH FLASH SALE TỪ BACKEND */}
      {flashSale?.isAvailable && (
        <div className="container mx-auto px-4 mt-4">
          <div className="rounded-xl bg-gradient-to-r from-red-600 via-orange-500 to-red-600 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-white shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 fill-current text-yellow-300 animate-bounce" />
              <div>
                <h2 className="text-base font-black uppercase tracking-wider">
                  GIỜ VÀNG FLASH SALE SẬP SÀN
                </h2>
                <p className="text-[11px] opacity-90">
                  Ưu đãi độc quyền giới hạn từ nhà tài trợ ShopTech
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-black/30 px-4 py-1.5 rounded-xl border border-white/20 text-xs font-bold">
              <Timer className="h-4 w-4 text-yellow-300" />
              <span>KẾT THÚC SAU:</span>
              <span className="bg-white text-red-600 px-1.5 py-0.5 rounded font-mono">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              :
              <span className="bg-white text-red-600 px-1.5 py-0.5 rounded font-mono">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              :
              <span className="bg-white text-red-600 px-1.5 py-0.5 rounded font-mono">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 py-6 text-card-foreground">
        <div className="rounded-xl bg-white p-6 shadow-sm border flex items-center justify-center aspect-square max-h-[500px]">
          <img
            src={getImageUrl(displayImage)}
            alt={p.name}
            className="max-h-full object-contain transition-all duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/500x500?text=No+Image";
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              <Tag className="h-3 w-3" /> {brandName}
            </span>
            {flashSale?.isAvailable && originalPrice > currentPrice && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black bg-red-600 text-white px-2 py-0.5 rounded-full ml-2 shadow-sm animate-bounce">
                Giảm {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% GỐC
              </span>
            )}
            <h1 className="text-2xl font-bold text-foreground leading-tight pt-1">{p.name}</h1>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-warning">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-foreground font-bold">{(p.averageRating || 0).toFixed(1)}</span>
            </span>
            <span className="text-muted-foreground">({reviews.length} đánh giá)</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">
              Tình trạng:{" "}
              <strong className="text-green-600">
                {currentStock > 0 ? `Còn hàng (${currentStock})` : "Hết hàng"}
              </strong>
            </span>
          </div>

          {/* KHỐI HIỂN THỊ GIÁ VÀ TIẾN ĐỘ CHÁY HÀNG CỦA FLASH SALE */}
          <div
            className={`rounded-xl p-4 border ${flashSale?.isAvailable ? "bg-red-50/40 border-red-200" : "bg-secondary"}`}
          >
            <div className="flex items-baseline gap-3">
              <span
                className={`text-3xl font-black tracking-tight ${flashSale?.isAvailable ? "text-red-600" : "text-primary"}`}
              >
                {currentPrice.toLocaleString("vi-VN")}₫
              </span>
              {originalPrice > currentPrice && (
                <span className="text-base text-muted-foreground line-through">
                  {originalPrice.toLocaleString("vi-VN")}₫
                </span>
              )}
            </div>

            {flashSale?.isAvailable && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-red-700">
                  <span>🔥 Đã bán: {flashSale.soldCount} sản phẩm</span>
                  <span>Mục tiêu deal: {flashSale.limitStock}</span>
                </div>
                <div className="w-full bg-red-100 rounded-full h-2.5 overflow-hidden border border-red-200 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${soldPercent}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* CHỌN PHIÊN BẢN BIẾN THỂ */}
          <div className="pt-2 pb-2 border-y space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Tùy chọn phiên bản
            </h3>
            {Object.keys(attributesGroup).length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                Sản phẩm có một phiên bản tiêu chuẩn mặc định.
              </div>
            ) : (
              Object.keys(attributesGroup).map((groupName) => (
                <div key={groupName} className="space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground block uppercase">
                    {groupName}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {attributesGroup[groupName].map((val) => {
                      const isSelected = selectedAttributes[groupName] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleSelectOption(groupName, val)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${isSelected ? "border-primary bg-primary text-primary-foreground shadow-sm scale-102" : "border-input bg-card hover:bg-secondary text-foreground"}`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleAddToCartFlow(true)}
              disabled={currentStock === 0}
              className={`rounded-xl px-4 py-3.5 font-bold text-white flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-400 text-xs uppercase ${flashSale?.isAvailable ? "bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 shadow-md" : "bg-primary hover:bg-primary/90"}`}
            >
              <ShoppingCart className="h-4 w-4" />
              {flashSale?.isAvailable ? "MUA NGAY GIÁ SỐC" : "MUA NGAY ĐƠN HÀNG"}
            </button>
            <button
              type="button"
              onClick={() => handleAddToCartFlow(false)}
              className="rounded-xl border-2 border-primary px-4 py-3.5 font-bold text-primary text-center hover:bg-primary/5 text-xs uppercase"
            >
              Thêm vào giỏ
            </button>
          </div>

          {/* THÔNG TIN CỬA HÀNG */}
          <StoreProfileSection store={store} productCount={totalStoreProducts} />

          <div className="grid grid-cols-3 gap-3 pt-4 border-t text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" /> Bảo hành chính hãng
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-primary" /> Giao hàng toàn quốc
            </div>
            <div className="flex items-center gap-1.5">
              <RotateCcw className="h-4 w-4 text-primary" /> Đổi trả 30 ngày
            </div>
          </div>
        </div>
      </div>

      {/* THÔNG SỐ KỸ THUẬT */}
      <div className="container mx-auto px-4 py-8 border-t mt-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="h-5 w-5 text-primary" />
          <h2 className="text-base font-black uppercase tracking-tight">
            Thông số kỹ thuật chi tiết
          </h2>
        </div>
        {specs.length === 0 ? (
          <p className="text-xs text-muted-foreground italic bg-secondary p-4 rounded-xl border border-dashed">
            Chưa cập nhật thông số.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-muted text-muted-foreground border-b uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3 font-bold w-1/3">Tính năng</th>
                  <th className="px-4 py-3 font-bold">Cấu hình</th>
                </tr>
              </thead>
              <tbody className="divide-y text-foreground">
                {specs.map((item, index) => (
                  <tr
                    key={item._id || index}
                    className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}
                  >
                    <td className="px-4 py-3 font-bold text-muted-foreground">{item.key}</td>
                    <td className="px-4 py-3 font-medium">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ĐÁNH GIÁ TỪ KHÁCH HÀNG */}
      <ProductReviews productId={p._id} />

      {storeProducts.length > 0 && (
        <ProductSection title="Các sản phẩm khác của Shop" products={storeProducts} />
      )}

      <ProductSection title="Sản phẩm tương tự" products={similarProducts} />
    </>
  );
}
