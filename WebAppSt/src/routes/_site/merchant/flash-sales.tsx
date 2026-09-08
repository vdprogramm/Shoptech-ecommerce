import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FlashSaleForm } from "@/components/site/FlashSaleForm";
import { flashSaleService, IFlashSaleCampaign } from "@/lib/api/api-flash-sale";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/merchant/flash-sales")({
  component: MerchantFlashSalePage,
});

function MerchantFlashSalePage() {
  const [campaigns, setCampaigns] = useState<IFlashSaleCampaign[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCampaign, setEditingCampaign] = useState<IFlashSaleCampaign | null>(null);
  const itemsPerPage = 10;

  const fetchCampaigns = async () => {
    try {
      const data = await flashSaleService.getAllCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error("Lỗi lấy danh sách chiến dịch:", error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-black text-foreground">KÊNH QUẢN LÝ NGƯỜI BÁN</h1>
        <p className="text-xs text-muted-foreground">
          Tự cấu hình hạ giá, thúc đẩy doanh số của riêng shop
        </p>
      </div>

      {/* Form tạo flash sale đã bị ẩn với Merchant theo yêu cầu */}

      <div className="bg-card p-6 border rounded-2xl shadow-sm">
        <h2 className="text-base font-black uppercase mb-4">
          Danh sách chiến dịch hiện có của shop
        </h2>
        {campaigns.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
            Chưa có chiến dịch nào. Hãy tạo mới ở biểu mẫu phía trên.
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((c) => {
                const now = new Date();
                const isStarted = new Date(c.startTime) <= now;
                const isEnded = new Date(c.endTime) < now;
                const isActuallyActive = c.isActive && isStarted && !isEnded;

                return (
                  <div
                    key={c._id}
                    className="p-4 border rounded-xl flex justify-between items-center hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <h3 className="font-bold text-primary">{c.campaignName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(c.startTime).toLocaleString()} -{" "}
                        {new Date(c.endTime).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2 py-1 text-[10px] font-bold rounded-full 
                                          ${
                                            isActuallyActive
                                              ? "bg-green-100 text-green-700"
                                              : "bg-gray-100 text-gray-600"
                                          }`}
                      >
                        {isActuallyActive ? "ĐANG HOẠT ĐỘNG" : "ĐÃ KẾT THÚC / CHỜ"}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
        {campaigns.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-4 py-3 border-t">
            <span className="text-sm text-muted-foreground">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, campaigns.length)} trên tổng {campaigns.length}{" "}
              chiến dịch
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
                Trang {currentPage} / {Math.ceil(campaigns.length / itemsPerPage)}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, Math.ceil(campaigns.length / itemsPerPage)),
                  )
                }
                disabled={currentPage === Math.ceil(campaigns.length / itemsPerPage)}
                className="px-3 py-1.5 text-sm font-medium border rounded-md disabled:opacity-50 hover:bg-muted bg-background"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
