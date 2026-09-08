import { useState, useEffect } from "react";
import { flashSaleService } from "@/lib/api/api-flash-sale";
import { productService } from "@/lib/api/api-product";
import { authService } from "@/lib/api/api-auth";
import axiosClient from "@/lib/api/axios-client"; // Dùng để gọi API lấy danh sách Store
import { Loader2, Plus, Trash2, Calendar, Zap, Store } from "lucide-react";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

interface FlashSaleFormProps {
  isAdmin: boolean;
  onSuccess: () => void;
  isEdit?: boolean;
  initialData?: any;
  onCancelEdit?: () => void;
}

export function FlashSaleForm({ isAdmin, onSuccess, isEdit, initialData, onCancelEdit }: FlashSaleFormProps) {
  const [campaignName, setCampaignName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Trạng thái lưu Store được chọn (Nếu admin chọn)
  const [selectedStoreId, setSelectedStoreId] = useState("");
  // Danh sách các Store lấy từ dữ liệu Backend về
  const [storesList, setStoresList] = useState<any[]>([]);

  const [availableVariants, setAvailableVariants] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. useEffect nạp dữ liệu Store hệ thống (Chỉ chạy khi tài khoản là ADMIN)
  useEffect(() => {
    if (isAdmin) {
      const fetchStores = async () => {
        try {
          const response = await axiosClient.get("/stores");
          setStoresList(response.data || []);
        } catch (err) {
          console.error("Không thể lấy danh sách cửa hàng:", err);
        }
      };
      fetchStores();
    }
  }, [isAdmin]);

  // 2. useEffect nạp danh sách sản phẩm/biến thể
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Nếu admin đã chọn 1 store cụ thể, ta có thể lọc sản phẩm của store đó
        // (Hoặc lấy tất cả sản phẩm đang có tùy cấu hình api của bạn)
        const params = selectedStoreId ? { store: selectedStoreId } : {};
        const products = await productService.getProducts(params);
        const variantsList: any[] = [];

        products.forEach((p: any) => {
          if (p.variants && Array.isArray(p.variants)) {
            p.variants.forEach((v: any) => {
              const specs = v.attributes ? Object.values(v.attributes).join(" / ") : "";
              variantsList.push({
                variantId: v._id,
                fullName: `${p.name} ${specs ? `(${specs})` : ""}`,
                originalPrice: v.price,
                storeId: p.store?._id || p.store,
                rawStore: p.store,
              });
            });
          }
        });
        setAvailableVariants(variantsList);
      } catch (err) {
        console.error("Lỗi nạp sản phẩm:", err);
      }
    };
    loadProducts();
  }, [selectedStoreId]); // Chạy lại mỗi khi Admin thay đổi Store chọn trên dropdown

  // 3. useEffect nạp dữ liệu chỉnh sửa
  useEffect(() => {
    if (isEdit && initialData) {
      setCampaignName(initialData.campaignName || "");
      // Chuyển đổi định dạng ISO string sang YYYY-MM-DDThh:mm
      setStartTime(initialData.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : "");
      setEndTime(initialData.endTime ? new Date(initialData.endTime).toISOString().slice(0, 16) : "");
      if (isAdmin && initialData.store) {
        setSelectedStoreId(typeof initialData.store === 'object' ? initialData.store._id : initialData.store);
      }
      
      const loadedItems = (initialData.items || []).map((item: any) => {
        let varId = "";
        if (typeof item.variant === "object" && item.variant !== null) {
          varId = item.variant._id;
        } else if (typeof item.variant === "string") {
          varId = item.variant;
        }
        return {
          variant: varId,
          salePrice: item.salePrice || 0,
          quantityLimit: item.quantityLimit || 5,
        };
      });
      setItems(loadedItems);
    } else if (!isEdit) {
      setCampaignName("");
      setStartTime("");
      setEndTime("");
      setItems([]);
      setSelectedStoreId("");
    }
  }, [isEdit, initialData, isAdmin]);

  const handleAddItem = () => {
    setItems([...items, { variant: "", salePrice: 0, quantityLimit: 5 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === "variant") {
      const selected = availableVariants.find((v) => v.variantId === value);
      if (selected) {
        newItems[index].salePrice = Math.round(selected.originalPrice * 0.8); // Giảm giá đề xuất 20%
      }
    }
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setErrorMsg("Vui lòng thêm ít nhất 1 sản phẩm vào chiến dịch!");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      const payload = {
        campaignName,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        items: items.map((item) => ({
          variant: item.variant,
          salePrice: Number(item.salePrice),
          quantityLimit: Number(item.quantityLimit),
        })),
        ...(isAdmin && selectedStoreId ? { store: selectedStoreId } : {}),
      };

      if (isEdit && initialData?._id) {
        await flashSaleService.updateFlashSale(initialData._id, payload);
        showSuccessModal("🎉 Cập nhật chiến dịch Flash Sale thành công!");
      } else {
        await flashSaleService.createFlashSale(payload);
        showSuccessModal("🎉 Tạo chiến dịch Flash Sale thành công!");
        setCampaignName("");
        setStartTime("");
        setEndTime("");
        setItems([]);
        setSelectedStoreId("");
      }
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Lỗi hệ thống khi lưu chiến dịch!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lọc biến thể hiển thị dựa theo Store
  const currentUser = authService.getCurrentUser();
  const merchantStoreId = currentUser?.storeId;

  const isStoreMatch = (rawStore: any, targetStoreId: string) => {
    if (!rawStore) return false;
    if (Array.isArray(rawStore)) {
      return rawStore.some((s: any) => {
        const id = typeof s === "object" && s !== null ? s._id : s;
        return String(id) === String(targetStoreId);
      });
    }
    const sId = typeof rawStore === "object" && rawStore !== null ? rawStore._id : rawStore;
    return String(sId) === String(targetStoreId);
  };

  let filteredVariants = availableVariants;
  if (isAdmin) {
    if (selectedStoreId) {
      filteredVariants = availableVariants.filter((v) => isStoreMatch(v.rawStore, selectedStoreId));
    }
  } else {
    if (merchantStoreId) {
      filteredVariants = availableVariants.filter((v) => isStoreMatch(v.rawStore, merchantStoreId));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 bg-card p-6 border rounded-2xl shadow-sm max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-2 border-b pb-3 text-red-600">
        <Zap className="h-5 w-5 fill-current" />
        <h2 className="text-base font-black uppercase tracking-wide">
          {isEdit ? "Cập nhật chiến dịch Giờ Vàng" : "Thiết lập chiến dịch Giờ Vàng mới"}
        </h2>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl font-medium border border-red-100">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Tên chương trình */}
      <div className="grid grid-cols-1 gap-1.5">
        <label className="text-xs font-bold text-muted-foreground uppercase">
          Tên chiến dịch Flash Sale
        </label>
        <input
          type="text"
          required
          placeholder="Ví dụ: ⚡ ĐẠI TIỆC GIỜ VÀNG CHỚP NHOÁNG"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border bg-background focus:outline-primary"
        />
      </div>

      {/* Cấu hình thời gian */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid grid-cols-1 gap-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Thời gian mở bán
          </label>
          <input
            type="datetime-local"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border bg-background focus:outline-primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Thời gian kết thúc
          </label>
          <input
            type="datetime-local"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border bg-background focus:outline-primary"
          />
        </div>
      </div>

      {/* 🔥 THAY ĐỔI TẠI ĐÂY: PHÂN QUYỀN ADMIN - LỰA CHỌN CỬA HÀNG QUA SELECT DROPDOWN */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-1.5 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
          <label className="text-xs font-black text-amber-800 uppercase flex items-center gap-1">
            <Store className="w-4 h-4" /> Chỉ định áp dụng cho Cửa hàng cụ thể
          </label>
          <select
            value={selectedStoreId}
            onChange={(e) => {
              setSelectedStoreId(e.target.value);
              setItems([]); // Reset lại danh sách sản phẩm đang chọn vì đã đổi store
            }}
            className="px-3 py-2 text-xs rounded-xl border border-amber-300 bg-background focus:outline-amber-600 font-medium"
          >
            <option value="">-- Áp dụng toàn sàn ShopTech (Tất cả cửa hàng) --</option>
            {storesList.map((store: any) => (
              <option key={store._id} value={store._id}>
                🏪 {store.name} {store.isActive === false ? "(Tạm đóng cửa)" : ""}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-amber-600 font-medium italic mt-0.5">
            * Khi chọn cửa hàng nào, danh sách chọn sản phẩm bên dưới sẽ tự động lọc ra sản phẩm
            riêng của cửa hàng đó.
          </p>
        </div>
      )}

      {/* Chọn danh sách sản phẩm tham gia sale */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-black uppercase text-muted-foreground tracking-wider">
            Danh sách sản phẩm giá sốc
          </label>
          <button
            type="button"
            onClick={handleAddItem}
            className="px-3 py-1 text-[11px] font-bold text-white bg-foreground hover:bg-foreground/90 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm sản phẩm
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center p-6 text-xs text-muted-foreground border border-dashed rounded-xl">
            Chưa có sản phẩm nào được chọn. Hãy ấn "Thêm sản phẩm" phía trên!
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row gap-3 p-3 border bg-secondary/20 rounded-xl items-end justify-between relative group"
              >
                {/* Select Biến thể đã được lọc theo Store */}
                <div className="grid grid-cols-1 gap-1 flex-1 w-full">
                  <label className="text-[10px] font-bold text-muted-foreground">
                    Chọn biến thể sản phẩm
                  </label>
                  <select
                    required
                    value={item.variant}
                    onChange={(e) => handleItemChange(index, "variant", e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border bg-background w-full"
                  >
                    <option value="">-- Chọn biến thể sản phẩm --</option>
                    {filteredVariants.map((av) => (
                      <option key={av.variantId} value={av.variantId}>
                        {av.fullName} - [Gốc: {av.originalPrice.toLocaleString()}₫]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-1 w-full md:w-36">
                  <label className="text-[10px] font-bold text-red-600 font-mono">
                    Giá Giờ Vàng (₫)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={item.salePrice || ""}
                    onChange={(e) => handleItemChange(index, "salePrice", e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border bg-background font-mono font-bold text-red-600"
                  />
                </div>

                <div className="grid grid-cols-1 gap-1 w-full md:w-28">
                  <label className="text-[10px] font-bold text-muted-foreground">
                    Số suất mở bán
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={item.quantityLimit}
                    onChange={(e) => handleItemChange(index, "quantityLimit", e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border bg-background"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-1.5 rounded-lg border hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors cursor-pointer mb-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white stroke-none" />
              {isEdit ? "Cập nhật cấu hình" : "Kích hoạt cấu hình Flash Sale lên sàn"}
            </>
          )}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="w-full md:w-auto px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Hủy chỉnh sửa
          </button>
        )}
      </div>
    </form>
  );
}
