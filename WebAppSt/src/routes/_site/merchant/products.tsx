import { useConfirm } from "@/hooks/use-confirm";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
// 🟢 Thay thế service của admin bằng apiMerchant chuyên biệt của phân hệ cửa hàng
import { apiMerchant } from "@/lib/api/api-merchant";
import { Loader2, Plus, Trash2, Edit3, PackageOpen, ArrowLeft } from "lucide-react";
import { authService } from "@/lib/api/api-auth";
import { MerchantProductForm } from "./-components/MerchantProductForm";
import { getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

export const Route = createFileRoute("/_site/merchant/products")({
  component: MerchantProductsManagement,
});

function MerchantProductsManagement() {
  const { confirm } = useConfirm();
  // Dữ liệu sản phẩm riêng cho chi nhánh
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Quản lý trạng thái chuyển đổi màn hình: Danh sách | Tạo mới | Chỉnh sửa
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [selectedProduct, setSelectedProduct] = useState<any | undefined>(undefined);

  const currentUser = authService.getCurrentUser() || undefined;

  // 1. TẢI DANH SÁCH SẢN PHẨM RIÊNG CỦA CHI NHÁNH (READ)
  const fetchMerchantProducts = async () => {
    try {
      setIsLoading(true);
      setError("");
      // 🟢 Gọi API merchant để lấy danh sách sản phẩm
      const response = await apiMerchant.getProducts();
      let data = response.data || response || [];

      // Lọc danh sách sản phẩm: Chỉ hiển thị sản phẩm thuộc về cửa hàng của Merchant hiện tại
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
    } catch (err: any) {
      console.error("Lỗi đồng bộ sản phẩm chi nhánh:", err);
      setError(err.response?.data?.message || "Không thể nạp danh sách sản phẩm của chi nhánh.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantProducts();
  }, []);

  // 2. XÓA SẢN PHẨM KHỎI CHI NHÁNH (DELETE)
  const handleDelete = async (id: string, name: string) => {
    if (await confirm(`Bạn có chắc chắn muốn gỡ sản phẩm "${name}" khỏi chi nhánh?`)) {
      try {
        await apiMerchant.deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p._id !== id));
        showSuccessModal("Đã gỡ sản phẩm thành công.");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Thao tác thất bại, vui lòng thử lại.");
      }
    }
  };

  // 3. THÊM MỚI SẢN PHẨM CHO CHI NHÁNH (POST)
  const handleCreateSubmit = async (
    data: any,
    variantsPayload?: any[],
    attributesPayload?: { key: string; value: string }[],
  ) => {
    try {
      setIsSubmitting(true);
      const createdProduct = await apiMerchant.createProduct(data);

      const createdId = createdProduct?.data?._id || (createdProduct as any)?._id;
      if (attributesPayload && attributesPayload.length > 0 && createdId) {
        try {
          await apiMerchant.upsertProductAttributes(createdId, attributesPayload);
        } catch (attrErr) {
          console.error("Lỗi thêm thông số kỹ thuật:", attrErr);
        }
      }

      showSuccessModal("Thêm sản phẩm cho chi nhánh thành công!");
      setViewMode("list");
      fetchMerchantProducts();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Không thể thêm mới sản phẩm. Vui lòng kiểm tra lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. CẬP NHẬT SẢN PHẨM CHI NHÁNH (PUT)
  const handleEditSubmit = async (
    data: any,
    variantsPayload?: any[],
    attributesPayload?: { key: string; value: string }[],
  ) => {
    const targetId = selectedProduct?._id;
    if (!targetId) return;

    try {
      setIsSubmitting(true);
      await apiMerchant.updateProduct(targetId, data);

      if (attributesPayload) {
        try {
          await apiMerchant.upsertProductAttributes(targetId, attributesPayload);
        } catch (attrErr) {
          console.error("Lỗi cập nhật thông số kỹ thuật:", attrErr);
        }
      }

      showSuccessModal("Cập nhật thông tin sản phẩm thành công!");
      setViewMode("list");
      fetchMerchantProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (product: any) => {
    setSelectedProduct(product);
    setViewMode("edit");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-red-500 mb-2" />
        <div>Đang truy vấn kho sản phẩm chi nhánh ShopTech...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 border border-dashed border-destructive/30 rounded-xl bg-destructive/5 m-4">
        <div className="text-sm font-semibold text-destructive mb-2">{error}</div>
        <button
          onClick={fetchMerchantProducts}
          className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
        >
          Thử tải lại danh sách
        </button>
      </div>
    );
  }

  // MÀN HÌNH THÊM MỚI SẢN PHẨM
  if (viewMode === "create") {
    return (
      <div className="p-6 space-y-4">
        <button
          onClick={() => setViewMode("list")}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 mb-2 cursor-pointer font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
        </button>
        <MerchantProductForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setViewMode("list")}
          isSubmitting={isSubmitting}
          storeId={currentUser?.storeId || ""}
        />
      </div>
    );
  }

  // MÀN HÌNH CHỈNH SỬA SẢN PHẨM
  if (viewMode === "edit") {
    return (
      <div className="p-6 space-y-4">
        <button
          onClick={() => setViewMode("list")}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 mb-2 cursor-pointer font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
        </button>
        <MerchantProductForm
          initialData={selectedProduct}
          onSubmit={handleEditSubmit}
          onCancel={() => setViewMode("list")}
          isSubmitting={isSubmitting}
          storeId={currentUser?.storeId || ""}
        />
      </div>
    );
  }

  // DIỆN MẠO BẢNG HIỂN THỊ CHÍNH (LIST MODE)
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý sản phẩm chi nhánh</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cửa hàng đang có: <span className="font-semibold text-gray-900">{products.length}</span>{" "}
            sản phẩm được phân phối
          </p>
        </div>
        <button
          onClick={() => setViewMode("create")}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Thêm sản phẩm vào shop
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl bg-white flex flex-col items-center justify-center text-gray-400">
          <PackageOpen className="h-10 w-10 text-gray-300 mb-2" />
          <p className="text-sm">Chưa có sản phẩm nào thuộc chi nhánh này.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead className="text-left text-xs text-gray-500 bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 font-semibold">Sản phẩm</th>
                <th className="py-3 px-3 font-semibold">Giá bán chi nhánh</th>
                <th className="py-3 px-3 font-semibold">Kho tồn tại shop</th>
                <th className="py-3 px-3 font-semibold">Đánh giá</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((p) => {
                  const displayImage =
                    p.images && p.images.length > 0 ? p.images[0] : "/placeholder-product.png";
                  const safeId = p._id || "";

                  return (
                    <tr
                      key={safeId}
                      className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={getImageUrl(displayImage)}
                          alt={p.name}
                          className="h-10 w-10 object-contain bg-white border border-gray-100 rounded-lg p-0.5 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/100x100?text=No+Image";
                          }}
                        />
                        <div className="truncate max-w-[280px] md:max-w-[400px]">
                          <span className="font-medium text-gray-900 block truncate">{p.name}</span>
                          <span
                            className={`inline-block text-[10px] px-1.5 py-0.2 mt-0.5 rounded-full font-medium ${p.isAvailable ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}
                          >
                            {p.isAvailable ? "Còn hàng" : "Hết hàng/Dừng bán"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-gray-900">
                        {(p.price || 0).toLocaleString("vi-VN")}₫
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={p.stock === 0 ? "text-red-500 font-semibold" : "text-gray-500"}
                        >
                          {p.stock || 0} máy
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-500 font-medium">★</span>
                          <span>{p.averageRating?.toFixed(1) || "0.0"}</span>
                          <span className="text-[11px] text-gray-400">({p.reviewCount || 0})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(p)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Sửa thông tin"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(safeId, p.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Gỡ khỏi shop"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {Math.ceil(products.length / itemsPerPage) > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-gray-500">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, products.length)} trên tổng {products.length}{" "}
                sản phẩm
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="text-sm font-medium px-2">
                  Trang {currentPage} / {Math.ceil(products.length / itemsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(Math.ceil(products.length / itemsPerPage), p + 1),
                    )
                  }
                  disabled={currentPage === Math.ceil(products.length / itemsPerPage)}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
