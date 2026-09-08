import { useConfirm } from "@/hooks/use-confirm";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminStoreService, IStore } from "@/lib/api/admin/api-admin-store";
import { StoreForm } from "./-components/StoreForm";
import {
  Loader2,
  Plus,
  Trash2,
  Edit3,
  Store,
  MapPin,
  Phone,
  UserCheck,
  Power,
  PowerOff,
} from "lucide-react";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

export const Route = createFileRoute("/_site/admin/stores")({
  component: AdminStoresManagement,
});

function AdminStoresManagement() {
  const { confirm } = useConfirm();
  const [stores, setStores] = useState<IStore[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Quản lý trạng thái view: list | create | edit
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [selectedStore, setSelectedStore] = useState<IStore | undefined>(undefined);

  // 1. FETCH DANH SÁCH CỬA HÀNG (READ)
  const loadStores = async () => {
    try {
      setIsLoading(true);
      const data = await adminStoreService.getStores();
      setStores(data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể nạp danh sách cửa hàng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  // 2. THÊM MỚI CỬA HÀNG (POST)
  const handleCreateSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await adminStoreService.createStore(data);
      showSuccessModal("Đã thành lập cửa hàng mới thành công!");
      setViewMode("list");
      loadStores();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khởi tạo cửa hàng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. CẬP NHẬT CỬA HÀNG (PATCH)
  const handleEditSubmit = async (data: any) => {
    if (!selectedStore?._id) return;
    try {
      setIsSubmitting(true);
      await adminStoreService.updateStore(selectedStore._id, data);
      showSuccessModal("Cập nhật thông tin cửa hàng thành công!");
      setViewMode("list");
      loadStores();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. BẬT/TẮT NHANH TRẠNG THÁI HOẠT ĐỘNG
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await adminStoreService.updateStore(id, { isActive: !currentStatus });
      setStores((prev) => prev.map((s) => (s._id === id ? { ...s, isActive: !currentStatus } : s)));
    } catch (err: any) {
      toast.error("Không thể chuyển đổi trạng thái cửa hàng.");
    }
  };

  // 5. XÓA CỬA HÀNG (DELETE)
  const handleDelete = async (id: string, name: string) => {
    if (await confirm(`Hành động này sẽ xóa vĩnh viễn cửa hàng "${name}". Tiếp tục?`)) {
      try {
        await adminStoreService.deleteStore(id);
        setStores((prev) => prev.filter((s) => s._id !== id));
        showSuccessModal("Đã gỡ bỏ cửa hàng khỏi hệ thống toàn quốc.");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Xóa cửa hàng thất bại.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        <div>Đang truy vấn chuỗi chi nhánh ShopTech...</div>
      </div>
    );
  }

  if (viewMode === "create") {
    return (
      <StoreForm
        onSubmit={handleCreateSubmit}
        onCancel={() => setViewMode("list")}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (viewMode === "edit") {
    return (
      <StoreForm
        initialData={selectedStore}
        onSubmit={handleEditSubmit}
        onCancel={() => setViewMode("list")}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold">Quản lý cửa hàng toàn quốc</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hệ thống đang kiểm soát:{" "}
            <span className="font-semibold text-foreground">{stores.length}</span> chi nhánh/đối
            tác.
          </p>
        </div>
        <button
          onClick={() => setViewMode("create")}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Thêm cửa hàng mới
        </button>
      </div>

      {stores.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground">
          <Store className="h-10 w-10 text-muted-foreground/40 mb-2" />
          <p className="text-sm">Chưa có dữ liệu chi nhánh nào trong DB.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border bg-background shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead className="text-left text-xs text-muted-foreground bg-muted/40 border-b">
              <tr>
                <th className="py-3 px-4 font-semibold">Cửa hàng</th>
                <th className="py-3 px-3 font-semibold">Địa chỉ kinh doanh</th>
                <th className="py-3 px-3 font-semibold">Liên hệ</th>
                <th className="py-3 px-3 font-semibold">Quản lý (Manager ID)</th>
                <th className="py-3 px-3 font-semibold">Trạng thái</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {stores
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((store) => {
                  const safeId = store._id || "";
                  const fallbackLogo = `https://placehold.co/100x100?text=${encodeURIComponent(store.name)}`;

                  return (
                    <tr
                      key={safeId}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 px-4 flex items-center gap-3">
                        <span className="font-semibold text-foreground">{store.name}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                          <span className="truncate max-w-[200px]">
                            {store.address || "Chưa cập nhật"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                          <span>{store.phone || "---"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground/80 bg-muted/50 px-2 py-1 rounded w-fit">
                          <UserCheck className="h-3 w-3" />
                          <span>{store.managerId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => toggleStatus(safeId, store.isActive)}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium shadow-2xs cursor-pointer transition-colors ${
                            store.isActive
                              ? "bg-success/10 text-success hover:bg-success/20"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          }`}
                          title="Click để thay đổi nhanh trạng thái"
                        >
                          {store.isActive ? (
                            <Power className="h-2.5 w-2.5" />
                          ) : (
                            <PowerOff className="h-2.5 w-2.5" />
                          )}
                          {store.isActive ? "Đang mở" : "Đã đóng"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedStore(store);
                              setViewMode("edit");
                            }}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                            title="Sửa cấu hình"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(safeId, store.name)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                            title="Xóa vĩnh viễn"
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
          {stores.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
              <span className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, stores.length)} trên tổng {stores.length} cửa
                hàng
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted bg-background"
                >
                  Trước
                </button>
                <span className="text-sm font-medium px-2">
                  Trang {currentPage} / {Math.ceil(stores.length / itemsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, Math.ceil(stores.length / itemsPerPage)),
                    )
                  }
                  disabled={currentPage === Math.ceil(stores.length / itemsPerPage)}
                  className="px-3 py-1.5 text-sm font-medium border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted bg-background"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
