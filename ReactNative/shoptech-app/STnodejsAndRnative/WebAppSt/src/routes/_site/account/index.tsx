import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authService } from "@/lib/api/api-auth";
import { UserCircle, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

export const Route = createFileRoute("/_site/account/")({
  component: AccountInfoPage,
});

function AccountInfoPage() {
  const [user, setUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    gender: "Nam",
    birthDate: "",
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      setFormData({
        fullName:
          currentUser.fullName || currentUser.name || currentUser.email?.split("@")[0] || "",
        phone: currentUser.phone || currentUser.phoneNumber || "",
        gender: currentUser.gender || "Nam",
        birthDate: currentUser.birthDate
          ? new Date(currentUser.birthDate).toISOString().split("T")[0]
          : "",
      });
    }
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const file = files[0];
      const base64Url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
      // Cập nhật lên Backend
      await authService.updateProfile({ avatar: base64Url });

      // Cập nhật state
      const updatedUser = { ...user, avatar: base64Url };
      setUser(updatedUser);
      // Cập nhật localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải ảnh đại diện");
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await authService.updateProfile(formData);

      const updatedUser = { ...user, ...formData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      showSuccessModal("Lưu thông tin thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi lưu thông tin");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <h2 className="text-xl font-bold mb-4">Thông tin cá nhân</h2>

      <div className="mb-6 flex flex-col items-center sm:items-start gap-4">
        <div className="relative group">
          <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-primary/20 bg-muted flex items-center justify-center shadow-sm">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <UserCircle className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <ImagePlus className="h-5 w-5 text-white" />
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">Nhấp vào ảnh để thay đổi Avatar</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3 max-w-2xl">
        <input
          className="rounded-lg border px-3 py-2"
          placeholder="Họ tên"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        />
        <input
          className="rounded-lg border px-3 py-2"
          placeholder="Số điện thoại"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <input
          className="md:col-span-2 rounded-lg border px-3 py-2 opacity-70"
          placeholder="Email"
          value={user?.email || ""}
          disabled
        />
        <input
          type="date"
          className="rounded-lg border px-3 py-2"
          value={formData.birthDate}
          onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
        />
        <select
          className="rounded-lg border px-3 py-2"
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
        >
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
          <option value="Khác">Khác</option>
        </select>
      </div>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-4 rounded-xl bg-primary px-6 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
      >
        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </>
  );
}
