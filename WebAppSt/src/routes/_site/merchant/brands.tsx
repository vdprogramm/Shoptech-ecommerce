import { useConfirm } from "@/hooks/use-confirm";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminBrandService, IBrand } from "@/lib/api/admin/api-admin-brand";
import { Loader2, Plus, Trash2, Edit3, ArrowLeft, Tag } from "lucide-react";
import { authService } from "@/lib/api/api-auth";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

export const Route = createFileRoute("/_site/merchant/brands")({
  component: MerchantBrandsManagement,
});

function MerchantBrandsManagement() {
  const { confirm } = useConfirm();
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [selectedBrand, setSelectedBrand] = useState<IBrand | undefined>(undefined);

  const currentUser = authService.getCurrentUser() || undefined;

  const fetchBrandsData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await adminBrandService.getBrands(currentUser?.storeId);
      setBrands(data || []);
    } catch (err: any) {
      console.error("Lỗi đồng bộ thương hiệu:", err);
      setError(err.response?.data?.message || "Không thể nạp danh sách thương hiệu từ máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandsData();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (await confirm(`Bạn có chắc chắn muốn xóa thương hiệu "${name}"?`)) {
      try {
        await adminBrandService.deleteBrand(id);
        setBrands((prev) => prev.filter((b) => b._id !== id));
        showSuccessModal("Đã xóa thương hiệu thành công.");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Xóa thất bại, vui lòng kiểm tra lại hệ thống.");
      }
    }
  };

  const startEdit = (brand: IBrand) => {
    setSelectedBrand(brand);
    setViewMode("edit");
  };

  const startCreate = () => {
    setSelectedBrand(undefined);
    setViewMode("create");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        <div>Đang tải danh sách thương hiệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 border border-dashed border-destructive/30 rounded-xl bg-destructive/5 m-4">
        <div className="text-sm font-semibold text-destructive mb-2">{error}</div>
        <button
          onClick={fetchBrandsData}
          className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 cursor-pointer"
        >
          Thử tải lại danh sách
        </button>
      </div>
    );
  }

  if (viewMode === "create" || viewMode === "edit") {
    return (
      <BrandForm
        initialData={selectedBrand}
        onCancel={() => setViewMode("list")}
        onSuccess={() => {
          setViewMode("list");
          fetchBrandsData();
        }}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold">Quản lý thương hiệu</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tổng cộng: <span className="font-semibold text-foreground">{brands.length}</span> thương
            hiệu
          </p>
        </div>
        <button
          onClick={startCreate}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Thêm thương hiệu
        </button>
      </div>

      {brands.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl bg-background flex flex-col items-center justify-center text-muted-foreground">
          <Tag className="h-10 w-10 text-muted-foreground/60 mb-2" />
          <p className="text-sm">Chưa có thương hiệu nào trong cơ sở dữ liệu.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border bg-background shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead className="text-left text-xs text-muted-foreground bg-muted/40 border-b">
              <tr>
                <th className="py-3 px-4 font-semibold">Thương hiệu</th>
                <th className="py-3 px-3 font-semibold">Mô tả</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {brands
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((b) => {
                  const safeId = b._id || "";
                  return (
                    <tr
                      key={safeId}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={b.logo || "/placeholder-product.png"}
                          alt={b.name}
                          className="h-10 w-10 object-contain bg-white border rounded-lg p-0.5 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/100x100?text=No+Image";
                          }}
                        />
                        <div className="font-medium text-foreground">{b.name}</div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground truncate max-w-[200px]">
                        {b.description || "Không có mô tả"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(b)}
                            className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Sửa"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(safeId, b.name)}
                            className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa"
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

          {Math.ceil(brands.length / itemsPerPage) > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, brands.length)} trên tổng {brands.length}{" "}
                thương hiệu
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="text-sm font-medium px-2">
                  Trang {currentPage} / {Math.ceil(brands.length / itemsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(Math.ceil(brands.length / itemsPerPage), p + 1))
                  }
                  disabled={currentPage === Math.ceil(brands.length / itemsPerPage)}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
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

function BrandForm({
  initialData,
  onCancel,
  onSuccess,
}: {
  initialData?: IBrand;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const currentUser = authService.getCurrentUser() || undefined;

  const [formData, setFormData] = useState<Partial<IBrand>>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    logo: initialData?.logo || "",
    storeId: initialData?.storeId || currentUser?.storeId || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { storeId, ...payload } = formData;
      if (initialData?._id) {
        await adminBrandService.updateBrand(initialData._id, payload);
        showSuccessModal("Cập nhật thương hiệu thành công!");
      } else {
        await adminBrandService.createBrand(payload);
        showSuccessModal("Thêm thương hiệu thành công!");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
      </button>
      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4">
          {initialData ? "Sửa thương hiệu" : "Thêm thương hiệu mới"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Tên thương hiệu <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Apple"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả thương hiệu..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL Logo</label>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded-md border bg-background hover:bg-muted cursor-pointer"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 cursor-pointer font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {initialData ? "Lưu thay đổi" : "Tạo thương hiệu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
