import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { storeService, type IStore } from "@/lib/api/api-store";
import { productService, type Product } from "@/lib/api/api-product";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";
import { ProductCard } from "@/components/site/ProductCard";
import { Store, MapPin, Phone, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_site/store/$id")({
  component: StoreDetailPage,
});

function StoreDetailPage() {
  const { id } = Route.useParams();
  const [store, setStore] = useState<IStore | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch store info
        const storeData = await storeService.getStoreById(id);
        setStore(storeData);

        // 2. Fetch products for this store
        const storeProducts = await productService.getProducts({ store: id });
        setProducts(storeProducts);
      } catch (err) {
        console.error("Lỗi lấy thông tin cửa hàng", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Đang tải thông tin cửa hàng...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy cửa hàng</h2>
        <p className="text-muted-foreground">Cửa hàng này không tồn tại hoặc đã ngừng hoạt động.</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: "Hệ thống cửa hàng", to: "/stores" }, { label: store.name }]} />

      {/* Cấu trúc Banner & Thông tin Shop */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-card rounded-2xl shadow-sm border p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 mb-8">
          <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-red-50 border border-red-100 flex items-center justify-center overflow-hidden shrink-0">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
            ) : (
              <Store className="h-10 w-10 text-red-500" />
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{store.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mt-3">
              {store.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {store.address}
                </span>
              )}
              {store.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" /> {store.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${store.isActive !== false ? "bg-green-500" : "bg-gray-400"}`}
                ></span>
                <span
                  className={`${store.isActive !== false ? "text-green-500" : "text-gray-500"} font-medium`}
                >
                  {store.isActive !== false ? "Đang hoạt động" : "Tạm nghỉ"}
                </span>
              </span>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-xl p-4 text-center min-w-[150px]">
            <p className="text-sm text-muted-foreground mb-1">Sản phẩm</p>
            <p className="text-2xl font-bold text-red-600">{products.length}</p>
          </div>
        </div>

        {/* Danh sách sản phẩm của Shop */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Sản phẩm của Shop</h2>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} p={product} />
              ))}
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center bg-secondary/10 rounded-xl border border-dashed">
              <Store className="h-12 w-12 text-muted-foreground mb-3 opacity-30" />
              <p className="text-muted-foreground">Cửa hàng này hiện chưa đăng sản phẩm nào.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
