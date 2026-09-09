import { useConfirm } from "@/hooks/use-confirm";
import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { apiAdminUser } from "../../../lib/api/admin/api-admin-user"; // Khớp theo cấu trúc thư mục của bạn
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

export const Route = createFileRoute("/_site/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State cho Modal Sửa Người Dùng
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    roles: [] as string[],
  });

  // 1. Hàm lấy danh sách người dùng hệ thống
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Vì hàm getAllUsers() của bạn đã return response.data nên ở đây ta nhận trực tiếp mảng dữ liệu
      const data = await apiAdminUser.getAllUsers();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      console.error("Lỗi lấy danh sách user:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  // 2. 🔥 Ghép thêm chức năng xóa tài khoản thực tế
  const handleDeleteUser = async (id: string, name: string) => {
    if (!(await confirm(`Bạn có chắc chắn muốn xóa tài khoản của "${name}" không?`))) {
      return;
    }

    try {
      await apiAdminUser.deleteUser(id);
      showSuccessModal("Xóa người dùng thành công!");
      fetchUsers(); // Tải lại danh sách sau khi xóa thành công
    } catch (err: any) {
      console.error("Lỗi xóa user:", err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi xóa tài khoản.");
    }
  };

  // Mở modal sửa
  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      roles: Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []),
    });
    setIsEditModalOpen(true);
  };

  // Đóng modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  // Xử lý submit cập nhật
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      await apiAdminUser.updateUser(editingUser._id, editFormData);
      toast.success("Cập nhật thông tin người dùng thành công!");
      closeEditModal();
      fetchUsers();
    } catch (err: any) {
      console.error("Lỗi cập nhật user:", err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật tài khoản.");
    }
  };

  // Xử lý đổi role trong form
  const handleRoleChange = (role: string) => {
    setEditFormData((prev) => {
      const currentRoles = prev.roles;
      if (currentRoles.includes(role)) {
        return { ...prev, roles: currentRoles.filter((r) => r !== role) };
      } else {
        return { ...prev, roles: [...currentRoles, role] };
      }
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const roleOptions = ["ADMIN", "STORE_OWNER", "STORE_STAFF", "SHIPPER", "CUSTOMER"];

  return (
    <div className="p-6 text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Quản lý người dùng</h2>
          <p className="text-xs text-gray-500">
            Xem thông tin chi tiết và phân quyền tài khoản thành viên hệ thống.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium border"
        >
          🔄 Làm mới dữ liệu
        </button>
      </div>

      {/* Hiển thị lỗi từ backend nếu có */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* State hiển thị khi đang tải */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin mx-auto mb-2"></div>
          Đang kết nối hệ thống dữ liệu...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Tên người dùng</th>
                <th className="py-3 px-4">Email đăng nhập</th>
                <th className="py-3 px-4">Quyền hạn (Role)</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    Hệ thống hiện tại chưa ghi nhận thành viên nào.
                  </td>
                </tr>
              ) : (
                users
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {u.fullName || "Chưa cập nhật"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">{u.email}</td>
                      <td className="py-3.5 px-4">
                        {/* Đọc mảng roles chuẩn chỉnh từ NestJS */}
                        {Array.isArray(u.roles) ? (
                          <div className="flex gap-1 flex-wrap">
                            {u.roles.map((role: string) => (
                              <span
                                key={role}
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                                  role === "ADMIN"
                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                    : role === "STORE_OWNER"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : role === "STORE_STAFF"
                                        ? "bg-orange-50 text-orange-700 border border-orange-200"
                                        : "bg-gray-50 text-gray-600 border border-gray-200"
                                }`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                            {u.role || "CUSTOMER"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-3">
                        <button 
                          onClick={() => openEditModal(u)}
                          className="text-blue-600 hover:text-blue-700 hover:underline text-xs font-semibold"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id, u.fullName || u.email)}
                          className="text-red-600 hover:text-red-700 hover:underline text-xs font-semibold"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
          {users.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <span className="text-sm text-gray-500">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, users.length)} trên tổng {users.length} người
                dùng
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium border rounded-md disabled:opacity-50 hover:bg-gray-100 bg-white"
                >
                  Trước
                </button>
                <span className="text-sm font-medium px-2 text-gray-600">
                  Trang {currentPage} / {Math.ceil(users.length / itemsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, Math.ceil(users.length / itemsPerPage)),
                    )
                  }
                  disabled={currentPage === Math.ceil(users.length / itemsPerPage)}
                  className="px-3 py-1.5 text-sm font-medium border rounded-md disabled:opacity-50 hover:bg-gray-100 bg-white"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa thông tin</h3>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên người dùng</label>
                <input
                  type="text"
                  required
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email đăng nhập</label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quyền hạn (Roles)</label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
                  {roleOptions.map((role) => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editFormData.roles.includes(role)}
                        onChange={() => handleRoleChange(role)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
