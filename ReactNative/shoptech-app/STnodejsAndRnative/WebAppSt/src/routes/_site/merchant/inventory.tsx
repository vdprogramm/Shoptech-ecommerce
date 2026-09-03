import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiMerchant } from "@/lib/api/api-merchant";
import { adminProductService } from "@/lib/api/admin/api-admin-product";
import { Loader2, PackagePlus, Search, PackageOpen, Plus, ArchiveRestore } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { authService } from "@/lib/api/api-auth";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

export const Route = createFileRoute("/_site/merchant/inventory")({
  component: MerchantInventoryPage,
});

function MerchantInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  // Lưu trữ số lượng nhập thêm cho từng variant
  const [addQuantities, setAddQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const currentUser = authService.getCurrentUser() || undefined;

  const fetchMerchantProducts = async () => {
    try {
      setIsLoading(true);
      const response = await apiMerchant.getProducts();
      let data = response.data || response || [];

      if (currentUser?.storeId) {
        data = data.filter((p: any) => {
          if (Array.isArray(p.store)) {
            return p.store.some(
              (s: any) => (typeof s === "object" && s !== null ? s._id : s) === currentUser.storeId,
            );
          }
          const productStoreId =
            typeof p.store === "object" && p.store !== null ? p.store._id : p.store;
          return productStoreId === currentUser.storeId;
        });
      }

      setProducts(data);
      setFilteredProducts(data);
    } catch (err: any) {
      console.error("Lỗi lấy danh sách sản phẩm:", err);
      toast.error("Không thể tải danh sách sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantProducts();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredProducts(products.filter((p) => p.name?.toLowerCase().includes(lowerQuery)));
    }
    setCurrentPage(1);
  }, [searchQuery, products]);

  const handleSelectProduct = async (product: any) => {
    setSelectedProduct(product);
    setAddQuantities({});
    try {
      setIsLoadingVariants(true);
      const data = await adminProductService.getVariantsByProduct(product._id);
      setVariants(data || []);
    } catch (error) {
      console.error("Lỗi lấy biến thể:", error);
      toast.error("Lỗi khi tải chi tiết cấu hình.");
    } finally {
      setIsLoadingVariants(false);
    }
  };

  const handleQuantityChange = (variantId: string, value: string) => {
    const num = parseInt(value, 10);
    setAddQuantities((prev) => ({
      ...prev,
      [variantId]: isNaN(num) ? 0 : num,
    }));
  };

  const handleAddStock = async (variantId: string) => {
    const quantity = addQuantities[variantId] || 0;
    if (quantity <= 0) {
      toast.warning("Vui lòng nhập số lượng lớn hơn 0");
      return;
    }

    try {
      setIsSubmitting(variantId);
      await apiMerchant.addStockProduct(variantId, quantity);
      showSuccessModal(`Đã nhập thêm ${quantity} sản phẩm thành công!`);

      // Reload variants
      const data = await adminProductService.getVariantsByProduct(selectedProduct._id);
      setVariants(data || []);
      setAddQuantities((prev) => ({ ...prev, [variantId]: 0 }));

      // Background reload products list to reflect total stock
      fetchMerchantProducts();
    } catch (error: any) {
      console.error("Lỗi cập nhật kho:", error);
      toast.error(error.response?.data?.message || "Lỗi khi nhập kho.");
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-48px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ArchiveRestore className="text-red-600" /> Nhập hàng / Quản lý tồn kho
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Lựa chọn sản phẩm và nhập thêm số lượng kho một cách nhanh chóng.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Cột trái: Danh sách sản phẩm */}
        <div className="w-full md:w-1/3 flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-red-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex justify-center p-10">
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center p-10 text-slate-400 text-sm">
                <PackageOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                Không tìm thấy sản phẩm nào.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredProducts
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((p) => {
                    const isSelected = selectedProduct?._id === p._id;
                    const image = p.images?.[0]
                      ? getImageUrl(p.images[0])
                      : "https://placehold.co/100x100?text=No+Image";
                    return (
                      <div
                        key={p._id}
                        onClick={() => handleSelectProduct(p)}
                        className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${isSelected ? "bg-red-50 border border-red-200" : "hover:bg-slate-50 border border-transparent"}`}
                      >
                        <img
                          src={image}
                          alt={p.name}
                          className="w-12 h-12 object-contain bg-white rounded border p-1 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">
                            {p.name}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Tồn tổng: <span className="font-bold">{p.stock || 0}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
          {filteredProducts.length > itemsPerPage && (
            <div className="p-2 border-t bg-slate-50 text-xs flex justify-between items-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-slate-500">
                {currentPage} / {Math.ceil(filteredProducts.length / itemsPerPage)}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(Math.ceil(filteredProducts.length / itemsPerPage), p + 1),
                  )
                }
                disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                className="px-2 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </div>

        {/* Cột phải: Chi tiết biến thể & Nhập kho */}
        <div className="w-full md:w-2/3 flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden">
          {selectedProduct ? (
            <>
              <div className="p-4 border-b bg-slate-50 flex items-center gap-3">
                <img
                  src={
                    selectedProduct.images?.[0]
                      ? getImageUrl(selectedProduct.images[0])
                      : "https://placehold.co/100x100?text=No+Image"
                  }
                  className="w-10 h-10 object-contain rounded bg-white border p-1"
                />
                <div>
                  <h3 className="font-bold text-slate-800">{selectedProduct.name}</h3>
                  <p className="text-xs text-slate-500">Chi tiết cấu hình và tồn kho</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingVariants ? (
                  <div className="flex justify-center p-10">
                    <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                  </div>
                ) : variants.length === 0 ? (
                  <div className="text-center p-10 text-slate-400">
                    Sản phẩm này chưa có biến thể nào.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variants.map((variant) => (
                      <div
                        key={variant._id}
                        className="border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            {variant.attributes?.["Màu sắc"]} / {variant.attributes?.["Dung lượng"]}
                            <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">
                              SKU: {variant.sku}
                            </span>
                          </h4>
                          <div className="text-sm text-slate-500 mt-1">
                            Tồn kho hiện tại:{" "}
                            <span
                              className={`font-bold ${variant.stock === 0 ? "text-red-500" : "text-green-600"}`}
                            >
                              {variant.stock}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto p-3 bg-slate-50 rounded-lg border">
                          <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                              Sl nhập thêm
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={addQuantities[variant._id] || ""}
                              onChange={(e) => handleQuantityChange(variant._id, e.target.value)}
                              className="w-24 border rounded p-1.5 text-sm font-semibold"
                            />
                          </div>
                          <button
                            onClick={() => handleAddStock(variant._id)}
                            disabled={isSubmitting === variant._id || !addQuantities[variant._id]}
                            className="mt-5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            {isSubmitting === variant._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                            Cộng kho
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
              <PackagePlus className="w-16 h-16 mb-4 opacity-30" />
              <p className="font-medium text-slate-600 mb-1">Chưa chọn sản phẩm</p>
              <p className="text-sm">
                Vui lòng chọn một sản phẩm từ danh sách bên trái để xem biến thể và nhập hàng.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
