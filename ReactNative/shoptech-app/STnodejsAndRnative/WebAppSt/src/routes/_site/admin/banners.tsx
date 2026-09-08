import { useConfirm } from "@/hooks/use-confirm";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { bannerService, IBanner } from "@/lib/api/api-banner";
import {
  Loader2,
  Plus,
  ArrowLeft,
  Image as ImageIcon,
  Edit,
  Trash2,
  ImagePlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/admin/banners")({
  component: AdminBannersManagement,
});

function AdminBannersManagement() {
  const { confirm } = useConfirm();
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [editingBanner, setEditingBanner] = useState<IBanner | null>(null);

  const fetchBannersData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await bannerService.findAll();
      setBanners(data || []);
    } catch (err: any) {
      console.error("Lỗi lấy danh sách banner:", err);
      setError("Không thể tải danh sách banner từ máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBannersData();
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await bannerService.toggleActive(id, !currentStatus);
      setBanners((prev) =>
        prev.map((b) => (b._id === id ? { ...b, isActive: !currentStatus } : b)),
      );
    } catch (err: any) {
      toast.error("Lỗi khi cập nhật trạng thái banner.");
    }
  };

  const startCreate = () => {
    setEditingBanner(null);
    setViewMode("create");
  };

  const startEdit = (banner: IBanner) => {
    setEditingBanner(banner);
    setViewMode("edit");
  };

  const handleDelete = async (id: string) => {
    if (await confirm("Bạn có chắc chắn muốn xóa banner này?")) {
      try {
        await bannerService.remove(id);
        setBanners((prev) => prev.filter((b) => b._id !== id));
      } catch (err: any) {
        toast.error("Có lỗi xảy ra khi xóa banner.");
      }
    }
  };

  const handleCreateSuccess = () => {
    setViewMode("list");
    fetchBannersData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Banner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý các banner hiển thị trên website.
          </p>
        </div>
        {viewMode === "list" && (
          <button
            onClick={startCreate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm Banner Mới
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {viewMode === "list" ? (
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 font-medium">Hình ảnh</th>
                  <th className="px-6 py-3 font-medium">Tiêu đề</th>
                  <th className="px-6 py-3 font-medium">Vị trí</th>
                  <th className="px-6 py-3 font-medium">Đường dẫn đích</th>
                  <th className="px-6 py-3 font-medium">Trạng thái</th>
                  <th className="px-6 py-3 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span>Đang tải dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : banners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground italic">
                      Chưa có banner nào được tạo.
                    </td>
                  </tr>
                ) : (
                  banners.map((banner) => (
                    <tr key={banner._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-24 h-12 bg-muted rounded-md overflow-hidden border">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{banner.title}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium">
                          {banner.position}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-muted-foreground max-w-[200px] truncate"
                        title={banner.targetLink}
                      >
                        {banner.targetLink || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggle(banner._id, banner.isActive)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                            banner.isActive ? "bg-primary" : "bg-input"
                          }`}
                        >
                          <span
                            className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                              banner.isActive ? "translate-x-2" : "-translate-x-2"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(banner)}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                            title="Sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(banner._id)}
                            className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <BannerForm
          onCancel={() => setViewMode("list")}
          onSuccess={handleCreateSuccess}
          initialData={editingBanner}
        />
      )}
    </div>
  );
}

function BannerForm({
  onCancel,
  onSuccess,
  initialData,
}: {
  onCancel: () => void;
  onSuccess: () => void;
  initialData?: IBanner | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    imageUrl: initialData?.imageUrl || "",
    targetLink: initialData?.targetLink || "",
    position: initialData?.position || "TopSlider",
  });
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setIsUploading(true);
      const file = files[0];
      const base64Url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
      setFormData((prev) => ({ ...prev, imageUrl: base64Url }));
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải ảnh");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl) {
      setError("Vui lòng nhập đầy đủ Tiêu đề và URL Hình ảnh.");
      return;
    }
    try {
      setIsSubmitting(true);
      setError("");
      if (initialData) {
        await bannerService.update(initialData._id, formData as Partial<IBanner>);
      } else {
        await bannerService.create(formData as Partial<IBanner>);
      }
      onSuccess();
    } catch (err: any) {
      setError(
        initialData
          ? "Có lỗi xảy ra khi cập nhật banner. Vui lòng thử lại."
          : "Có lỗi xảy ra khi tạo banner. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/20">
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">
          {initialData ? "Cập nhật Banner" : "Tạo Banner Mới"}
        </h2>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tiêu đề Banner <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="VD: Khuyến mãi Mùa Hè"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Hình ảnh Banner <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label
                className={`border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 transition-colors rounded-xl flex flex-col items-center justify-center cursor-pointer bg-card gap-2 text-muted-foreground overflow-hidden ${formData.imageUrl ? "w-full sm:w-1/3 aspect-video" : "w-full aspect-[3/1]"}`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs">Đang tải...</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-xs font-semibold">Tải ảnh lên</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              {formData.imageUrl && (
                <div className="w-full sm:w-2/3 h-auto sm:h-40 aspect-video sm:aspect-auto bg-muted rounded-xl overflow-hidden border relative group flex-shrink-0">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, imageUrl: "" }))}
                    className="absolute top-2 right-2 p-1.5 bg-destructive/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa ảnh"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Đường dẫn đích (Target Link)</label>
            <input
              type="text"
              name="targetLink"
              value={formData.targetLink}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="VD: /category/dien-thoai"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vị trí hiển thị</label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="TopSlider">Top Slider (Trang chủ)</option>
              <option value="Sidebar">Sidebar</option>
              <option value="Popup">Popup</option>
            </select>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6 py-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Đang lưu..." : "Lưu Banner"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-6 py-2"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
