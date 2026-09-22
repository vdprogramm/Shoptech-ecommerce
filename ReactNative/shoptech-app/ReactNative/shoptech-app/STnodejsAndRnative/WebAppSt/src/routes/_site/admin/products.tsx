import { useConfirm } from "@/hooks/use-confirm";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminProductService, IProduct } from "@/lib/api/admin/api-admin-product";
import { adminStoreService } from "@/lib/api/admin/api-admin-store";
import { ProductForm } from "./-components/ProductForm"; // Nạp form từ thư mục có tiền tố "-"
import { Loader2, Plus, Trash2, Edit3, PackageOpen, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

// Component hỗ trợ lấy tên cửa hàng nếu backend chỉ trả về object rỗng hoặc string ID
function AsyncStoreName({ storeData }: { storeData: any }) {
  const initialName = storeData?.name || storeData?.storeName;
  let storeId = typeof storeData === "string" ? storeData : storeData?._id || storeData?.id;
  if (!storeId && Array.isArray(storeData) && storeData.length > 0) {
    storeId =
      typeof storeData[0] === "string" ? storeData[0] : storeData[0]?._id || storeData[0]?.id;
  }

  const [name, setName] = useState(initialName || "Đang tải...");

  useEffect(() => {
    if (!initialName && storeId) {
      adminStoreService
        .getStoreById(storeId)
        .then((res) => {
          if (res && res.name) setName(res.name);
          else setName("Cửa hàng không xác định");
        })
        .catch(() => setName("Cửa hàng không xác định"));
    } else if (!initialName && !storeId) {
      setName("Hệ thống ShopTech");
    }
  }, [storeId, initialName]);

  return <>{name}</>;
}

export const Route = createFileRoute("/_site/admin/products")({
  component: AdminProductsManagement,
});

function AdminProductsManagement() {
  const { confirm } = useConfirm();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Quản lý trạng thái chuyển đổi màn hình: Danh sách | Tạo mới | Chỉnh sửa
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [selectedProduct, setSelectedProduct] = useState<IProduct | undefined>(undefined);

  // 1. CHỨC NĂNG TẢI DANH SÁCH (READ)
  const fetchProductsData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await adminProductService.getProducts();
      setProducts(data || []);
    } catch (err: any) {
      console.error("Lỗi đồng bộ sản phẩm thật:", err);
      setError(err.response?.data?.message || "Không thể nạp danh sách sản phẩm từ máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsData();
  }, []);

  // 2. CHỨC NĂNG XÓA SẢN PHẨM (DELETE)
  const handleDelete = async (id: string, name: string) => {
    if (await confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" khỏi hệ thống?`)) {
      try {
        await adminProductService.deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p._id !== id));
        showSuccessModal("Đã xóa sản phẩm thành công.");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Xóa thất bại, vui lòng kiểm tra lại hệ thống.");
      }
    }
  };

  // 3. CHỨC NĂNG THÊM MỚI SẢN PHẨM (POST)
  const handleCreateSubmit = async (
    data: any,
    variantsPayload?: any[],
    attributesPayload?: { key: string; value: string }[],
  ) => {
    try {
      setIsSubmitting(true);
      const createdProduct = await adminProductService.createProduct(data);

      // Nếu có biến thể, gọi API thêm biến thể ở đây nếu backend yêu cầu (hoặc backend tự xử lý)
      // Nhưng theo backend có thể nó đã tạo biến thể trong createProduct nếu truyền đúng định dạng.

      // Thêm thông số kỹ thuật (Attributes)
      if (attributesPayload && attributesPayload.length > 0 && createdProduct._id) {
        try {
          await adminProductService.upsertProductAttributes(createdProduct._id, attributesPayload);
        } catch (attrErr) {
          console.error("Lỗi thêm thông số kỹ thuật:", attrErr);
        }
      }

      showSuccessModal("Thêm sản phẩm thành công!");
      setViewMode("list");
      fetchProductsData(); // Tải lại danh sách mới nhất từ DB
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Không thể thêm mới sản phẩm. Vui lòng kiểm tra lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. CHỨC NĂNG CHỈNH SỬA SẢN PHẨM (PUT)
  const handleEditSubmit = async (
    data: any,
    variantsPayload?: any[],
    attributesPayload?: { key: string; value: string }[],
  ) => {
    const targetId = selectedProduct?._id;
    if (!targetId) return;

    try {
      setIsSubmitting(true);
      await adminProductService.updateProduct(targetId, data);

      // Cập nhật thông số kỹ thuật (Attributes)
      if (attributesPayload) {
        try {
          await adminProductService.upsertProductAttributes(targetId, attributesPayload);
        } catch (attrErr) {
          console.error("Lỗi cập nhật thông số kỹ thuật:", attrErr);
        }
      }

      showSuccessModal("Cập nhật sản phẩm thành công!");
      setViewMode("list");
      fetchProductsData(); // Làm mới danh sách
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kích hoạt giao diện sửa và lưu trữ dữ liệu gốc của hàng được chọn
  const startEdit = (product: IProduct) => {
    setSelectedProduct(product);
    setViewMode("edit");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        <div>Đang truy vấn kho sản phẩm ShopTech...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 border border-dashed border-destructive/30 rounded-xl bg-destructive/5 m-4">
        <div className="text-sm font-semibold text-destructive mb-2">{error}</div>
        <button
          onClick={fetchProductsData}
          className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90"
        >
          Thử tải lại danh sách
        </button>
      </div>
    );
  }

  // DIỆN MẠO GIAO DIỆN KHI MỞ MÀN HÌNH THÊM MỚI
  if (viewMode === "create") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewMode("list")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
        </button>
        <ProductForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setViewMode("list")}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  // DIỆN MẠO GIAO DIỆN KHI MỞ MÀN HÌNH CHỈNH SỬA
  if (viewMode === "edit") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewMode("list")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
        </button>
        <ProductForm
          initialData={selectedProduct}
          onSubmit={handleEditSubmit}
          onCancel={() => setViewMode("list")}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  // DIỆN MẠO BẢNG HIỂN THỊ CHÍNH (LIST MODE)
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const currentProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold">Quản lý sản phẩm</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tổng cộng: <span className="font-semibold text-foreground">{products.length}</span> sản
            phẩm thực tế trong DB
          </p>
        </div>
        <button
          onClick={() => setViewMode("create")}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl bg-background flex flex-col items-center justify-center text-muted-foreground">
          <PackageOpen className="h-10 w-10 text-muted-foreground/60 mb-2" />
          <p className="text-sm">Chưa có sản phẩm nào trong cơ sở dữ liệu.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border bg-background shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead className="text-left text-xs text-muted-foreground bg-muted/40 border-b">
              <tr>
                <th className="py-3 px-4 font-semibold">Sản phẩm</th>
                <th className="py-3 px-3 font-semibold">Giá niêm yết</th>
                <th className="py-3 px-3 font-semibold">Kho tồn</th>
                <th className="py-3 px-3 font-semibold">Đánh giá</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((p) => {
                const displayImage =
                  p.images && p.images.length > 0 ? p.images[0] : "/placeholder-product.png";
                const safeId = p._id || "";

                return (
                  <tr
                    key={safeId}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={displayImage}
                        alt={p.name}
                        className="h-10 w-10 object-contain bg-muted border rounded-lg p-0.5 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/100x100?text=No+Image";
                        }}
                      />
                      <div className="truncate max-w-[280px] md:max-w-[400px]">
                        <Link
                          to="/product/$id"
                          params={{ id: safeId }}
                          className="font-medium text-foreground hover:text-primary transition-colors block truncate"
                        >
                          {p.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`inline-block text-[10px] px-1.5 py-0.2 rounded-full font-medium ${p.isAvailable ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                          >
                            {p.isAvailable ? "Đang kinh doanh" : "Ngừng bán"}
                          </span>
                          {p.store && (
                            <span
                              className="text-xs text-primary font-medium flex items-center gap-1"
                              title="Cửa hàng sở hữu sản phẩm này"
                            >
                              🏪 <AsyncStoreName storeData={p.store} />
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground">
                      {p.price.toLocaleString("vi-VN")}₫
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={
                          p.stock === 0 ? "text-destructive font-semibold" : "text-muted-foreground"
                        }
                      >
                        {p.stock} máy
                      </span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500 font-medium">★</span>
                        <span>{p.averageRating?.toFixed(1) || "0.0"}</span>
                        <span className="text-[11px] text-muted-foreground/70">
                          ({p.reviewCount || 0})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(safeId, p.name)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                          title="Xóa sản phẩm"
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
        </div>
      )}

      {/* Pagination Controls */}
      {viewMode === "list" && products.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border bg-background text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Trước
          </button>
          <div className="text-sm font-medium px-4">
            Trang {currentPage} / {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border bg-background text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Sau
          </button>
        </div>
      )}
    </>
  );
}
