import { useConfirm } from "@/hooks/use-confirm";
import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { voucherService } from "@/lib/api/api-voucher";
import { authService } from "@/lib/api/api-auth";
import { Loader2, Trash2, Calendar, Percent, Banknote } from "lucide-react";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

export const Route = createFileRoute("/_site/merchant/vouchers")({
  component: MerchantVouchersPage,
});

interface IVoucher {
  _id: string;
  code: string;
  discountAmount: number;
  discountType: "fixed" | "percent";
  minOrderValue: number;
  expirationDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

function MerchantVouchersPage() {
  const { confirm } = useConfirm();
  const [vouchers, setVouchers] = useState<IVoucher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    code: "",
    discountType: "fixed",
    discountAmount: 0,
    minOrderValue: 0,
    expirationDate: "",
    usageLimit: 100,
  });

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const data = await voucherService.getVouchersAdmin();
      const currentUser = authService.getCurrentUser();
      if (currentUser?.role === "merchant" && currentUser?.storeId) {
        setVouchers(
          data.filter((v: any) => {
            const vStoreId =
              typeof v.store === "object" && v.store !== null ? v.store._id : v.store;
            return vStoreId === currentUser.storeId;
          }),
        );
      } else {
        setVouchers(data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách voucher:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentUser = authService.getCurrentUser();
      const payload: any = { ...formData };
      if (currentUser?.storeId) {
        payload.store = currentUser.storeId;
      }

      await voucherService.createVoucherAdmin(payload);
      showSuccessModal("Tạo mã giảm giá thành công!");
      setIsOpenModal(false);
      setFormData({
        code: "",
        discountType: "fixed",
        discountAmount: 0,
        minOrderValue: 0,
        expirationDate: "",
        usageLimit: 100,
      });
      fetchVouchers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi tạo voucher, trùng mã hoặc nhập thiếu!");
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) {
      try {
        await voucherService.deleteVoucherAdmin(id);
        showSuccessModal("Đã xóa voucher thành công!");
        fetchVouchers();
      } catch (error) {
        toast.error("Lỗi không thể xóa voucher này.");
      }
    }
  };

  return (
    <div className="p-4 bg-card rounded-xl border shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Voucher & Khuyến mãi</h2>
          <p className="text-xs text-muted-foreground">
            Quản lý các chương trình ưu đãi của riêng cửa hàng bạn
          </p>
        </div>
        <button
          onClick={() => setIsOpenModal(true)}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
        >
          + Tạo voucher mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-muted-foreground gap-2 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-primary" /> Đang tải danh sách voucher...
        </div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
          Chưa có mã giảm giá nào. Hãy bấm nút phía trên để tạo.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground border-b uppercase tracking-wider bg-muted/40">
              <tr>
                <th className="py-3 px-4">Mã CODE</th>
                <th>Loại giảm</th>
                <th>Mức Giảm</th>
                <th>Đơn tối thiểu</th>
                <th>Đã dùng / Giới hạn</th>
                <th>Ngày hết hạn (HSD)</th>
                <th className="text-right pr-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vouchers
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((v) => (
                  <tr key={v._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">{v.code}</td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${v.discountType === "percent" ? "bg-blue-500/10 text-blue-600" : "bg-green-500/10 text-green-600"}`}
                      >
                        {v.discountType === "percent" ? (
                          <Percent className="w-3 h-3" />
                        ) : (
                          <Banknote className="w-3 h-3" />
                        )}
                        {v.discountType === "percent" ? "Phần trăm" : "Tiền mặt"}
                      </span>
                    </td>
                    <td className="font-semibold text-foreground">
                      {v.discountType === "percent"
                        ? `${v.discountAmount}%`
                        : `${v.discountAmount.toLocaleString()}₫`}
                    </td>
                    <td className="text-muted-foreground">{v.minOrderValue.toLocaleString()}₫</td>
                    <td className="text-sm">
                      <span className="font-semibold text-foreground">{v.usedCount}</span>
                      <span className="text-muted-foreground"> / {v.usageLimit}</span>
                    </td>
                    <td className="text-muted-foreground text-xs font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(v.expirationDate).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="text-right pr-4">
                      <button
                        onClick={() => handleDelete(v._id)}
                        className="text-destructive p-1.5 hover:bg-destructive/10 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Xóa mã này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {vouchers.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
              <span className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, vouchers.length)} trên tổng {vouchers.length}{" "}
                mã giảm giá
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium border rounded-md disabled:opacity-50 hover:bg-muted bg-background"
                >
                  Trước
                </button>
                <span className="text-sm font-medium px-2">
                  Trang {currentPage} / {Math.ceil(vouchers.length / itemsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, Math.ceil(vouchers.length / itemsPerPage)),
                    )
                  }
                  disabled={currentPage === Math.ceil(vouchers.length / itemsPerPage)}
                  className="px-3 py-1.5 text-sm font-medium border rounded-md disabled:opacity-50 hover:bg-muted bg-background"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isOpenModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 border shadow-2xl relative">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Thêm mã giảm giá cho cửa hàng
            </h3>

            <form onSubmit={handleCreateVoucher} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                  Mã CODE (Viết liền, không dấu)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: LAPTOP500K"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                  }
                  className="w-full rounded-lg border px-3 py-2 bg-background font-mono font-bold tracking-wide uppercase focus:outline-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                    Loại chiết khấu
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, discountType: e.target.value }))
                    }
                    className="w-full rounded-lg border px-3 py-2 bg-background focus:outline-primary"
                  >
                    <option value="fixed">Số tiền mặt (₫)</option>
                    <option value="percent">Phần trăm (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                    Giá trị giảm
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder={
                      formData.discountType === "percent" ? "Ví dụ: 10" : "Ví dụ: 500000"
                    }
                    value={formData.discountAmount || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, discountAmount: Number(e.target.value) }))
                    }
                    className="w-full rounded-lg border px-3 py-2 bg-background font-semibold focus:outline-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                    Đơn tối thiểu áp dụng
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Ví dụ: 2000000"
                    value={formData.minOrderValue || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, minOrderValue: Number(e.target.value) }))
                    }
                    className="w-full rounded-lg border px-3 py-2 bg-background focus:outline-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                    Tổng lượt sử dụng
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, usageLimit: Number(e.target.value) }))
                    }
                    className="w-full rounded-lg border px-3 py-2 bg-background focus:outline-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                  Ngày hết hạn (HSD)
                </label>
                <input
                  type="date"
                  required
                  value={formData.expirationDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, expirationDate: e.target.value }))
                  }
                  className="w-full rounded-lg border px-3 py-2 bg-background focus:outline-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-muted font-medium transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
