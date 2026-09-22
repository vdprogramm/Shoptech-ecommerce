import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ProductCard, Product } from "@/components/site/ProductCard";
import { wishlistsService } from "@/lib/api/api-wishlist";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_site/account/wishlist")({
  component: WishlistComponent,
});

function WishlistComponent() {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setIsLoading(true);
        const data = await wishlistsService.getMyWishlist();

        if (Array.isArray(data)) {
          // Xử lý cả 2 trường hợp:
          // 1. Backend trả về array các document Wishlist (mỗi document có field `product` chứa thông tin sản phẩm)
          // 2. Backend trả về trực tiếp array Product[]
          const products = data.map((item: any) => (item?.product ? item.product : item));
          setWishlistProducts(products.filter((p) => p && p._id)); // Lọc bỏ các phần tử null/undefined
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách yêu thích:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  return (
    <>
      <h2 className="text-xl font-bold mb-4">Sản phẩm yêu thích</h2>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải danh sách yêu thích...</p>
        </div>
      ) : wishlistProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {wishlistProducts.map((p) => (
            <ProductCard key={p._id} p={p} isLikedDefault={true} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10">
          <p className="text-sm text-muted-foreground">Bạn chưa có sản phẩm yêu thích nào.</p>
        </div>
      )}
    </>
  );
}
