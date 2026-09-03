import { useConfirm } from "@/hooks/use-confirm";
import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { apiAdminUser } from "../../../lib/api/admin/api-admin-user";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

export const Route = createFileRoute("/_site/admin/shippers")({
  component: AdminShippersPage,
});

function AdminShippersPage() {
  const { confirm } = useConfirm();
  const [shippers, setShippers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // States for creating new Shipper
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newShipper, setNewShipper] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [createLoading, setCreateLoading] = useState<boolean>(false);

  // 1. Hàm lấy danh sách người giao hàng
  const fetchShippers = async () => {
    setLoading(true);
    try {
      const data = await apiAdminUser.getAllUsers();
      // Filter out users who have SHIPPER role
      const shippersData = data.filter((user: any) =>
        Array.isArray(user.roles) ? user.roles.includes("SHIPPER") : user.role === "SHIPPER",
      );
      setShippers(shippersData);
      setError(null);
    } catch (err: any) {
      console.error("Lỗi lấy danh sách shipper:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách người giao hàng.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Hàm xóa Shipper
  const handleDeleteShipper = async (id: string, name: string) => {
    if (!(await confirm(`Bạn có chắc chắn muốn xóa người giao hàng "${name}" không?`))) {
      return;
    }

    try {
      await apiAdminUser.deleteUser(id);
      showSuccessModal("Xóa người giao hàng thành công!");
      fetchShippers();
    } catch (err: any) {
      console.error("Lỗi xóa shipper:", err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi xóa tài khoản.");
    }
  };

  // 3. Hàm tạo Shipper mới
  const handleCreateShipper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShipper.fullName || !newShipper.email || !newShipper.password) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setCreateLoading(true);
    try {
      await apiAdminUser.createUserByAdmin({
        ...newShipper,
        roles: ["SHIPPER"],
      });
      showSuccessModal("Tạo người giao hàng mới thành công!");
      setIsModalOpen(false);
      setNewShipper({ fullName: "", email: "", password: "" });
      fetchShippers();
    } catch (err: any) {
      console.error("Lỗi tạo shipper:", err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi tạo tài khoản.");
    } finally {
      setCreateLoading(false);
    }
  };

  useEffect(() => {
    fetchShippers();
  }, []);

  return (
    <div className="p-6 text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Quản lý người giao hàng (Shipper)</h2>
          <p className="text-xs text-gray-500">
            Xem thông tin và tạo tài khoản cho người giao hàng.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium shadow-sm"
          >
            + Tạo Shipper
          </button>
          <button
            onClick={fetchShippers}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium border"
          >
            🔄 Làm mới
          </button>
        </div>
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
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
          Đang kết nối hệ thống dữ liệu...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Tên Shipper</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Số dư ví</th>
                <th className="py-3 px-4">Trạng thái Online</th>
                <th className="py-3 px-4">Trạng thái HĐ</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {shippers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Chưa có người giao hàng nào trên hệ thống.
                  </td>
                </tr>
              ) : (
                shippers
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {u.fullName || "Chưa cập nhật"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">{u.email}</td>
                      <td className="py-3.5 px-4 font-semibold text-green-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(u.walletBalance || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.isOnline ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-green-50 text-green-700 border border-green-200">
                            Bật (Online)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-gray-50 text-gray-600 border border-gray-200">
                            Tắt (Offline)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                            Đã kích hoạt
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-red-50 text-red-700 border border-red-200">
                            Chưa kích hoạt
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-3">
                        <button
                          onClick={async () => {
                            try {
                              const res = await apiAdminUser.toggleActivation(u._id);
                              showSuccessModal(res.message);
                              fetchShippers();
                            } catch (err: any) {
                              toast.error(
                                err.response?.data?.message || "Lỗi khi cập nhật trạng thái",
                              );
                            }
                          }}
                          className={`${u.isActive ? "text-orange-600 hover:text-orange-700" : "text-blue-600 hover:text-blue-700"} hover:underline text-xs font-semibold`}
                        >
                          {u.isActive ? "Hủy kích hoạt" : "Kích hoạt"}
                        </button>
                        <button
                          onClick={() => handleDeleteShipper(u._id, u.fullName || u.email)}
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
          {shippers.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <span className="text-sm text-gray-500">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, shippers.length)} trên tổng {shippers.length}{" "}
                shipper
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
                  Trang {currentPage} / {Math.ceil(shippers.length / itemsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, Math.ceil(shippers.length / itemsPerPage)),
                    )
                  }
                  disabled={currentPage === Math.ceil(shippers.length / itemsPerPage)}
                  className="px-3 py-1.5 text-sm font-medium border rounded-md disabled:opacity-50 hover:bg-gray-100 bg-white"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Tạo Shipper Mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Tạo tài khoản Shipper</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShipper} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                <input
                  type="text"
                  value={newShipper.fullName}
                  onChange={(e) => setNewShipper({ ...newShipper, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Nhập tên người giao hàng"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newShipper.email}
                  onChange={(e) => setNewShipper({ ...newShipper, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="shipper@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={newShipper.password}
                  onChange={(e) => setNewShipper({ ...newShipper, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Nhập mật khẩu ít nhất 6 ký tự"
                  minLength={6}
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                >
                  {createLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Xác nhận tạo"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
