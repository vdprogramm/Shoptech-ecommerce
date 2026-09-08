import { useConfirm } from "@/hooks/use-confirm";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiWarranty } from "../../../lib/api/api-warranty";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

export const Route = createFileRoute("/_site/admin/warranties")({
  component: AdminWarranties,
});

function AdminWarranties() {
  const { confirm } = useConfirm();
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    userId: "",
    orderId: "",
    productId: "",
    startDate: "",
    durationMonths: 12,
  });

  const fetchWarranties = async () => {
    try {
      setLoading(true);
      const res = await apiWarranty.getAllWarranties();
      setWarranties(res?.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách bảo hành:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, []);

  const handleDelete = async (id: string) => {
    if (await confirm("Bạn có chắc chắn muốn xóa phiếu bảo hành này?")) {
      try {
        await apiWarranty.deleteWarranty(id);
        showSuccessModal("Xóa thành công!");
        fetchWarranties();
      } catch (error) {
        console.error(error);
        toast.error("Xóa thất bại!");
      }
    }
  };

  const handleEditClick = (w: any) => {
    setEditId(w._id);
    setFormData({
      userId: w.user?._id || w.user || "",
      orderId: w.order?._id || w.order || "",
      productId: w.product?._id || w.product || "",
      startDate: w.startDate ? new Date(w.startDate).toISOString().split("T")[0] : "",
      durationMonths: 12,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editId) {
        await apiWarranty.updateWarranty(editId, formData);
        showSuccessModal("Cập nhật bảo hành thành công!");
      } else {
        await apiWarranty.createWarranty(formData);
        showSuccessModal("Tạo bảo hành thành công!");
      }
      setShowModal(false);
      setEditId(null);
      setFormData({
        userId: "",
        orderId: "",
        productId: "",
        startDate: "",
        durationMonths: 12,
      });
      fetchWarranties();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi lưu bảo hành!");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData({
      userId: "",
      orderId: "",
      productId: "",
      startDate: "",
      durationMonths: 12,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Bảo hành (Admin)</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Thêm bảo hành
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && warranties.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : warranties.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Chưa có phiếu bảo hành nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Khách hàng</th>
                  <th className="px-6 py-3">Mã đơn hàng</th>
                  <th className="px-6 py-3">Sản phẩm</th>
                  <th className="px-6 py-3">Ngày bắt đầu</th>
                  <th className="px-6 py-3">Ngày kết thúc</th>
                  <th className="px-6 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {warranties
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((w) => (
                    <tr key={w._id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{w.user?.fullName || w.user?.email || "N/A"}</td>
                      <td className="px-6 py-4 font-mono">
                        {w.order?.orderCode || w.order?._id || "N/A"}
                      </td>
                      <td className="px-6 py-4">{w.product?.name || "N/A"}</td>
                      <td className="px-6 py-4">
                        {w.startDate
                          ? format(new Date(w.startDate), "dd/MM/yyyy", { locale: vi })
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 font-medium text-red-600">
                        {w.endDate
                          ? format(new Date(w.endDate), "dd/MM/yyyy", { locale: vi })
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditClick(w)}
                          className="text-blue-600 hover:text-blue-800 transition mr-2"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(w._id)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {warranties.length > itemsPerPage && (
              <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50">
                <span className="text-sm text-gray-500">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, warranties.length)} trên tổng{" "}
                  {warranties.length} phiếu bảo hành
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
                    Trang {currentPage} / {Math.ceil(warranties.length / itemsPerPage)}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, Math.ceil(warranties.length / itemsPerPage)),
                      )
                    }
                    disabled={currentPage === Math.ceil(warranties.length / itemsPerPage)}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {editId ? "Sửa Phiếu Bảo Hành" : "Tạo Phiếu Bảo Hành"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">User ID</label>
                <input
                  required
                  className="w-full border p-2 rounded"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order ID</label>
                <input
                  required
                  className="w-full border p-2 rounded"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product ID</label>
                <input
                  required
                  className="w-full border p-2 rounded"
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                <input
                  type="date"
                  required
                  className="w-full border p-2 rounded"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thời hạn (Tháng)</label>
                <input
                  type="number"
                  required
                  className="w-full border p-2 rounded"
                  value={formData.durationMonths}
                  onChange={(e) =>
                    setFormData({ ...formData, durationMonths: Number(e.target.value) })
                  }
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
