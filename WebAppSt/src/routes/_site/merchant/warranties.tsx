import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiWarranty } from "../../../lib/api/api-warranty";
import { Loader2, Plus, Trash2, Edit3, Shield, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";
import { useConfirm } from "@/hooks/use-confirm";

export const Route = createFileRoute("/_site/merchant/warranties")({
  component: MerchantWarrantiesManagement,
});

function MerchantWarrantiesManagement() {
  const { confirm } = useConfirm();
  const [warranties, setWarranties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [selectedWarranty, setSelectedWarranty] = useState<any>(undefined);

  const fetchWarranties = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await apiWarranty.getMerchantWarranties();
      setWarranties(res.data?.data || res.data || []);
    } catch (err: any) {
      console.error("Lỗi đồng bộ bảo hành:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách bảo hành.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, []);

  const handleDelete = async (id: string) => {
    if (await confirm("Bạn có chắc chắn muốn xóa phiếu bảo hành này?")) {
      try {
        await apiWarranty.deleteWarranty(id);
        setWarranties((prev) => prev.filter((w) => w._id !== id));
        showSuccessModal("Đã xóa bảo hành thành công.");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Xóa thất bại.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-red-600 mb-2" />
        <div>Đang tải thông tin bảo hành...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 border border-dashed border-red-200 rounded-xl bg-red-50 m-4">
        <div className="text-sm font-semibold text-red-600 mb-2">{error}</div>
        <button
          onClick={fetchWarranties}
          className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition"
        >
          Thử tải lại
        </button>
      </div>
    );
  }

  if (viewMode === "create" || viewMode === "edit") {
    return (
      <WarrantyForm
        initialData={selectedWarranty}
        onCancel={() => setViewMode("list")}
        onSuccess={() => {
          setViewMode("list");
          fetchWarranties();
        }}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold">Quản lý bảo hành</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tổng cộng: <span className="font-semibold text-foreground">{warranties.length}</span> phiếu bảo hành của cửa hàng
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedWarranty(undefined);
            setViewMode("create");
          }}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Thêm bảo hành
        </button>
      </div>

      {warranties.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl bg-white flex flex-col items-center justify-center text-muted-foreground">
          <Shield className="h-10 w-10 text-muted-foreground/60 mb-2" />
          <p className="text-sm">Chưa có phiếu bảo hành nào.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead className="text-left text-xs text-muted-foreground bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 font-semibold">Khách hàng</th>
                <th className="py-3 px-3 font-semibold">Sản phẩm</th>
                <th className="py-3 px-3 font-semibold">Ngày bắt đầu</th>
                <th className="py-3 px-3 font-semibold">Ngày kết thúc</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {warranties
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((w) => {
                  return (
                    <tr key={w._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        {w.user?.fullname || w.user?.email || w.userId || "Khách hàng"}
                      </td>
                      <td className="py-3 px-3 font-medium">
                        {w.product?.name || w.productId || "Không rõ sản phẩm"}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {new Date(w.startDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {w.endDate ? new Date(w.endDate).toLocaleDateString("vi-VN") : "Không rõ"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedWarranty(w);
                              setViewMode("edit");
                            }}
                            className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(w._id)}
                            className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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

          {Math.ceil(warranties.length / itemsPerPage) > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, warranties.length)} trên {warranties.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-sm font-medium px-2">
                  Trang {currentPage} / {Math.ceil(warranties.length / itemsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(Math.ceil(warranties.length / itemsPerPage), p + 1))
                  }
                  disabled={currentPage === Math.ceil(warranties.length / itemsPerPage)}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
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

function WarrantyForm({
  initialData,
  onCancel,
  onSuccess,
}: {
  initialData?: any;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    userId: initialData?.user?._id || initialData?.userId || "",
    orderId: initialData?.order?._id || initialData?.orderId || "",
    productId: initialData?.product?._id || initialData?.productId || "",
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 10) : "",
    durationMonths: 12,
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 10) : "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (initialData?._id) {
        await apiWarranty.updateWarranty(initialData._id, formData);
        showSuccessModal("Cập nhật bảo hành thành công!");
      } else {
        await apiWarranty.createWarranty(formData);
        showSuccessModal("Tạo bảo hành thành công!");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu bảo hành.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại
      </button>
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4">
          {initialData ? "Sửa Phiếu Bảo Hành" : "Tạo Phiếu Bảo Hành"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ID Người dùng</label>
            <input
              type="text"
              required
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ID Sản phẩm</label>
            <input
              type="text"
              required
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ID Đơn hàng (Tuỳ chọn)</label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                required
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            {initialData && (
              <div>
                <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            )}
            {!initialData && (
              <div>
                <label className="block text-sm font-medium mb-1">Thời hạn (Tháng)</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={formData.durationMonths}
                  onChange={(e) => setFormData({ ...formData, durationMonths: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded-md border bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {initialData ? "Lưu thay đổi" : "Tạo bảo hành"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
