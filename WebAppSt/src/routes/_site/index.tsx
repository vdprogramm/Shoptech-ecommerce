import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Hero } from "@/components/site/Hero";
import { CategoryGrid } from "@/components/site/CategoryGrid";
import { FlashSale } from "@/components/site/FlashSale"; // Thành phần tự gọi API đếm ngược real-time
import { ProductSection } from "@/components/site/ProductSection";
import { productService, type IBrand } from "@/lib/api/api-product";
import { Product } from "@/components/site/ProductCard";
import { Loader2, Layers } from "lucide-react";

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "ShopTech - Mua sắm thiết bị điện tử chính hãng, giá tốt" },
      {
        name: "description",
        content:
          "Hệ thống mua bán & quản lý thiết bị điện tử trực tuyến: điện thoại, laptop, tablet, phụ kiện. Trợ lý AI tư vấn 24/7.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [newProductsList, setNewProductsList] = useState<Product[]>([]);
  const [bestSellersList, setBestSellersList] = useState<Product[]>([]);
  const [allBestSellers, setAllBestSellers] = useState<Product[]>([]); // Lưu trữ best sellers toàn cục
  const [isLoading, setIsLoading] = useState(true);

  // 1. Nạp dữ liệu ban đầu từ Backend NestJS
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);

        // Gọi đồng thời API Products, Best Sellers và API Brands để tối ưu tốc độ nạp trang
        const [allProductsData, bestSellersData, brandData] = await Promise.all([
          productService.getProducts({ isAvailable: true }),
          productService.getBestSellers(50), // Lấy 50 sản phẩm bán chạy để có thể lọc theo brand
          productService.getBrands(),
        ]);

        setBrands(brandData || []);
        setAllBestSellers(bestSellersData || []);
        distributeProducts(allProductsData || [], bestSellersData || [], null);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu trang chủ từ NestJS:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // 2. Thuật toán phân phối dữ liệu dựa theo trạng thái lọc Thương hiệu
  const distributeProducts = (
    allProducts: Product[],
    bestSellers: Product[],
    brandId: string | null,
  ) => {
    const filteredNew = brandId
      ? allProducts.filter((p) => {
          if (typeof p.brand === "object" && p.brand !== null) {
            return p.brand._id === brandId;
          }
          return p.brand === brandId;
        })
      : allProducts;

    const filteredBest = brandId
      ? bestSellers.filter((p) => {
          if (typeof p.brand === "object" && p.brand !== null) {
            return p.brand._id === brandId;
          }
          return p.brand === brandId;
        })
      : bestSellers;

    // Phân phối dữ liệu cho "Sản phẩm mới" (Bản ghi mới nhất lên đầu)
    const sortedNew = [...filteredNew].reverse();
    setNewProductsList(sortedNew);

    // Phân phối dữ liệu cho "Bán chạy nhất" (Lấy từ API best-sellers, đã sắp xếp theo lượt mua)
    const sortedBest = [...filteredBest];
    setBestSellersList(sortedBest);
  };

  // 3. Hàm xử lý sự kiện khi click chọn nút lọc Thương hiệu
  const handleSelectBrand = async (brandId: string | null) => {
    setSelectedBrandId(brandId);
    try {
      setIsLoading(true);
      const query: Record<string, any> = { isAvailable: true };
      if (brandId) {
        query.brand = brandId;
      }
      const productsData = await productService.getProducts(query);
      distributeProducts(productsData || [], allBestSellers, brandId);
    } catch (error) {
      console.error("Lỗi lọc sản phẩm theo Brand:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Hero />
      <CategoryGrid />

      {/* KHU VỰC CHÈN THANH CHỌN THƯƠNG HIỆU (BRANDS FILTER BAR) */}
      <div className="container mx-auto px-4 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Thương hiệu đối tác chính hãng
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Nút mặc định: Xem tất cả */}
          <button
            onClick={() => handleSelectBrand(null)}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              selectedBrandId === null
                ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "border-input bg-card hover:bg-secondary text-foreground"
            }`}
          >
            Tất cả thương hiệu
          </button>

          {/* Đổ danh sách Brand từ MongoDB */}
          {brands.map((brand) => {
            const isSelected = selectedBrandId === brand._id;
            return (
              <button
                key={brand._id}
                onClick={() => handleSelectBrand(brand._id)}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-2 h-[36px] ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-102"
                    : "border-input bg-card hover:bg-secondary text-foreground"
                }`}
              >
                <span>{brand.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="container mx-auto px-4">
        <hr className="border-muted/60" />
      </div>

      {/* KHU VỰC HIỂN THỊ CÁC KHỐI SẢN PHẨM */}
      {isLoading ? (
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium animate-pulse">
            Đang cấu trúc lại danh mục sản phẩm ShopTech...
          </p>
        </div>
      ) : (
        <>
          {/* Khối Giờ Vàng Flash Sale độc lập: Tự động ẩn nếu Backend không trả về chiến dịch live */}
          <FlashSale />

          {/* Khối sản phẩm mới */}
          {newProductsList.length > 0 ? (
            <ProductSection title="Sản phẩm mới" products={newProductsList} slug="moi" />
          ) : (
            <div className="container mx-auto px-4 py-6 text-center text-xs text-muted-foreground italic">
              Không tìm thấy sản phẩm mới nào thuộc thương hiệu này.
            </div>
          )}

          {/* Khối sản phẩm bán chạy */}
          {bestSellersList.length > 0 && (
            <ProductSection title="Bán chạy nhất" products={bestSellersList} slug="ban-chay" />
          )}
        </>
      )}
    </>
  );
}
