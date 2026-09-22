import React, { useState } from "react";
import { apiMerchant } from "../../../../lib/api/api-merchant";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

interface StaffFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function StaffForm({ onClose, onSuccess }: StaffFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 🟢 KHỚP DỮ LIỆU TUYỆT ĐỐI: Chỉ gửi chính xác 3 trường mà CreateUserDto yêu cầu
      const cleanPayload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      // Gọi API truyền đúng cấu trúc
      await apiMerchant.createStaff(cleanPayload);

      showSuccessModal("Thêm nhân viên chi nhánh thành công!");
      onSuccess(); // Đóng modal và reload bảng ở trang cha
    } catch (error: any) {
      console.error("Lỗi chi tiết 400:", error.response?.data);

      // Xử lý đọc chuỗi lỗi thân thiện từ class-validator NestJS vứt ra
      const backendMessage = error.response?.data?.message;
      const finalError = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;

      toast.error(finalError || "Có lỗi xảy ra khi tạo tài khoản. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-gray-900">
        <h3 className="text-xl font-bold mb-4">Thêm Nhân Viên Chi Nhánh</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
            <input
              type="text"
              required
              disabled={loading}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-100 transition-all text-sm"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email đăng nhập *
            </label>
            <input
              type="email"
              required
              disabled={loading}
              placeholder="nhanvien@shoptech.com"
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-100 transition-all text-sm"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu khởi tạo *
            </label>
            <input
              type="password"
              required
              minLength={6}
              disabled={loading}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-100 transition-all text-sm"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang tạo...
                </>
              ) : (
                "Tạo tài khoản"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
