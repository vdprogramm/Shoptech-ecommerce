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

  useEffect(() => {
    fetchUsers();
  }, []);

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
                        <button className="text-blue-600 hover:text-blue-700 hover:underline text-xs font-semibold">
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
    </div>
  );
}
