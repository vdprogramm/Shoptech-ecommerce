import { useEffect, useState } from "react";
import { IStore } from "@/lib/api/admin/api-admin-store";
import { apiAdminUser } from "@/lib/api/admin/api-admin-user";
import { Loader2, Store, KeyRound, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

interface StoreFormProps {
  initialData?: IStore;
  // onSubmit lúc này nhận data gộp hoặc data đã qua xử lý
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function StoreForm({ initialData, onSubmit, onCancel, isSubmitting }: StoreFormProps) {
  const [loadingLocal, setLoadingLocal] = useState(false);

  // State quản lý Form nhập liệu
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    logoUrl: "",
    isActive: true,

    // 🌟 BỔ SUNG: Các trường tạo tài khoản Chủ cửa hàng trực tiếp
    merchantEmail: "",
    merchantPassword: "",
    merchantFullName: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        address: initialData.address || "",
        phone: initialData.phone || "",
        logoUrl: initialData.logoUrl || "",
        isActive: initialData.isActive ?? true,
        merchantEmail: "",
        merchantPassword: "",
        merchantFullName: "",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra validation các trường cốt lõi
    if (!formData.name.trim()) {
      toast.error("Vui lòng điền tên cửa hàng.");
      return;
    }

    // CHẾ ĐỘ: TẠO MỚI (Bắt buộc điền thông tin tài khoản chủ shop)
    if (!initialData) {
      if (
        !formData.merchantEmail.trim() ||
        !formData.merchantPassword.trim() ||
        !formData.merchantFullName.trim()
      ) {
        toast.error("Vui lòng nhập đầy đủ thông tin tài khoản khởi tạo cho Chủ cửa hàng (*)");
        return;
      }

      setLoadingLocal(true);
      try {
        // 🔥 BƯỚC 1: Gọi ngầm API tạo User với quyền STORE_OWNER
        const userRes = await apiAdminUser.createUserByAdmin({
          email: formData.merchantEmail,
          password: formData.merchantPassword,
          fullName: formData.merchantFullName,
          roles: ["STORE_OWNER"],
        });

        const generatedManagerId = userRes.data?._id;

        if (!generatedManagerId) {
          throw new Error("Không nhận được mã ID từ hệ thống lưu trữ.");
        }

        // 🔥 BƯỚC 2: Trả dữ liệu Store kèm theo ID vừa sinh ra lên component cha xử lý tiếp
        onSubmit({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          logoUrl: formData.logoUrl,
          isActive: formData.isActive,
          managerId: generatedManagerId, // ID TỰ ĐỘNG MAP VÀO ĐÂY CHỨ KHÔNG CẦN GÕ TAY!
        });
      } catch (error: any) {
        console.error("Lỗi luồng tạo tự động:", error);
        toast.error(
          error?.response?.data?.message ||
            "Lỗi tạo tài khoản chủ shop, vui lòng thử lại email khác.",
        );
        setLoadingLocal(false);
      }
    } else {
      // CHẾ ĐỘ: CẬP NHẬT (Chỉ cập nhật thông tin cửa hàng, giữ nguyên Manager cũ)
      onSubmit({
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        logoUrl: formData.logoUrl,
        isActive: formData.isActive,
      });
    }
  };

  const isProcessing = isSubmitting || loadingLocal;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-2xl bg-card border p-6 rounded-xl shadow-sm text-black dark:text-white"
    >
      <div>
        <h3 className="text-base font-bold border-b pb-2 flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          {initialData ? "Cập nhật thông tin chi nhánh" : "Khởi tạo chi nhánh kinh doanh mới"}
        </h3>
      </div>

      {/* PHẦN 1: THÔNG TIN CỦA CỬA HÀNG */}
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold">
            Tên cửa hàng <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className="w-full text-sm p-2 rounded-lg border bg-background"
            placeholder="Ví dụ: ShopTech Cầu Giấy"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Số điện thoại hotline chi nhánh</label>
            <input
              type="text"
              className="w-full text-sm p-2 rounded-lg border bg-background"
              placeholder="09xx xxx xxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Địa chỉ chi nhánh</label>
            <input
              type="text"
              className="w-full text-sm p-2 rounded-lg border bg-background"
              placeholder="Số 123 Cầu Giấy, Hà Nội"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* PHẦN 2: TỰ SINH TÀI KHOẢN CHỦ SHOP (ẨN ĐI KHI SỬA - CHỈ HIỆN KHI TẠO MỚI) */}
      {!initialData && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-bold flex items-center gap-2 text-teal-600 dark:text-teal-400">
            <KeyRound className="h-4 w-4" /> Cấp tài khoản quản trị cho Chủ chi nhánh (Tự động liên
            kết)
          </h4>

          <div className="space-y-1">
            <label className="text-xs font-semibold">
              Họ và tên chủ sở hữu <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              className="w-full text-sm p-2 rounded-lg border bg-background"
              placeholder="Nguyễn Văn A"
              value={formData.merchantFullName}
              onChange={(e) => setFormData({ ...formData, merchantFullName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">
                Email đăng nhập quản trị <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                className="w-full text-sm p-2 rounded-lg border bg-background"
                placeholder="caugiay@shoptech.com"
                value={formData.merchantEmail}
                onChange={(e) => setFormData({ ...formData, merchantEmail: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">
                Mật khẩu khởi tạo <span className="text-destructive">*</span>
              </label>
              <input
                type="password"
                className="w-full text-sm p-2 rounded-lg border bg-background"
                placeholder="Nhập mật khẩu gốc..."
                value={formData.merchantPassword}
                onChange={(e) => setFormData({ ...formData, merchantPassword: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 py-1 border-t pt-4">
        <input
          type="checkbox"
          id="isActive"
          className="rounded border-gray-300"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        />
        <label htmlFor="isActive" className="text-xs font-semibold select-none cursor-pointer">
          Cho phép chi nhánh này đi vào hoạt động kinh doanh ngay lập tức
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="text-xs font-medium px-4 py-2 border rounded-lg hover:bg-muted transition"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={isProcessing}
          className="text-xs font-bold px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 transition"
        >
          {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
          {initialData ? "Lưu thay đổi" : "Khởi tạo hệ thống động"}
        </button>
      </div>
    </form>
  );
}
