import { useConfirm } from "@/hooks/use-confirm";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminCategoryService, ICategory } from "@/lib/api/admin/api-admin-category";
import { Loader2, Plus, Trash2, Edit3, ArrowLeft, Grid } from "lucide-react";
import { authService } from "@/lib/api/api-auth";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

export const Route = createFileRoute("/_site/merchant/categories")({
  component: MerchantCategoriesManagement,
});

function MerchantCategoriesManagement() {
  const { confirm } = useConfirm();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [selectedCategory, setSelectedCategory] = useState<ICategory | undefined>(undefined);

  const currentUser = authService.getCurrentUser() || undefined;

  const fetchCategoriesData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await adminCategoryService.getCategories(currentUser?.storeId);
      setCategories(data || []);
    } catch (err: any) {
      console.error("Lỗi đồng bộ danh mục:", err);
      setError(err.response?.data?.message || "Không thể nạp danh sách danh mục từ máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesData();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (await confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) {
      try {
        await adminCategoryService.deleteCategory(id);
        setCategories((prev) => prev.filter((c) => c._id !== id));
        showSuccessModal("Đã xóa danh mục thành công.");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Xóa thất bại, vui lòng kiểm tra lại hệ thống.");
      }
    }
  };

  const startEdit = (category: ICategory) => {
    setSelectedCategory(category);
    setViewMode("edit");
  };

  const startCreate = () => {
    setSelectedCategory(undefined);
    setViewMode("create");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        <div>Đang tải danh sách danh mục...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 border border-dashed border-destructive/30 rounded-xl bg-destructive/5 m-4">
        <div className="text-sm font-semibold text-destructive mb-2">{error}</div>
        <button
          onClick={fetchCategoriesData}
          className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 cursor-pointer"
        >
          Thử tải lại danh sách
        </button>
      </div>
    );
  }

  if (viewMode === "create" || viewMode === "edit") {
    return (
      <CategoryForm
        initialData={selectedCategory}
        onCancel={() => setViewMode("list")}
        onSuccess={() => {
          setViewMode("list");
          fetchCategoriesData();
        }}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold">Quản lý danh mục</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tổng cộng: <span className="font-semibold text-foreground">{categories.length}</span>{" "}
            danh mục
          </p>
        </div>
        <button
          onClick={startCreate}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Thêm danh mục
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl bg-background flex flex-col items-center justify-center text-muted-foreground">
          <Grid className="h-10 w-10 text-muted-foreground/60 mb-2" />
          <p className="text-sm">Chưa có danh mục nào trong cơ sở dữ liệu.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border bg-background shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead className="text-left text-xs text-muted-foreground bg-muted/40 border-b">
              <tr>
                <th className="py-3 px-4 font-semibold">Danh mục</th>
                <th className="py-3 px-3 font-semibold">Mô tả</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((c) => {
                  const safeId = c._id || "";
                  return (
                    <tr
                      key={safeId}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={c.image || "/placeholder-product.png"}
                          alt={c.name}
                          className="h-10 w-10 object-contain bg-white border rounded-lg p-0.5 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/100x100?text=No+Image";
                          }}
                        />
                        <div className="font-medium text-foreground">{c.name}</div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground truncate max-w-[200px]">
                        {c.description || "Không có mô tả"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(c)}
                            className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Sửa"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(safeId, c.name)}
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

          {Math.ceil(categories.length / itemsPerPage) > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, categories.length)} trên tổng{" "}
                {categories.length} danh mục
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
                  Trang {currentPage} / {Math.ceil(categories.length / itemsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(Math.ceil(categories.length / itemsPerPage), p + 1),
                    )
                  }
                  disabled={currentPage === Math.ceil(categories.length / itemsPerPage)}
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

function CategoryForm({
  initialData,
  onCancel,
  onSuccess,
}: {
  initialData?: ICategory;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const currentUser = authService.getCurrentUser() || undefined;

  const [formData, setFormData] = useState<Partial<ICategory>>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    image: initialData?.image || "",
    storeId: initialData?.storeId || currentUser?.storeId || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { storeId, ...payload } = formData;
      if (initialData?._id) {
        await adminCategoryService.updateCategory(initialData._id, payload);
        showSuccessModal("Cập nhật danh mục thành công!");
      } else {
        await adminCategoryService.createCategory(payload);
        showSuccessModal("Thêm danh mục thành công!");
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
          {initialData ? "Sửa danh mục" : "Thêm danh mục mới"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Tên danh mục <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Điện thoại"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả danh mục..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL Hình ảnh</label>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.png"
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
              {initialData ? "Lưu thay đổi" : "Tạo danh mục"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
