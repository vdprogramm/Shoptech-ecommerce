import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";
import { Tag, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { voucherService } from "@/lib/api/api-voucher";

export const Route = createFileRoute("/_site/promotions")({
  component: PromotionsPage,
});

function PromotionsPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const data = await voucherService.getPublicVouchers();
        setPromos(data || []);
      } catch (error) {
        console.error("Lỗi khi tải khuyến mãi:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPromos();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Không giới hạn";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + "₫";
  };

  const getDesc = (v: any) => {
    let desc = "";
    if (v.discountType === "PERCENTAGE") {
      desc = `Giảm ${v.discountAmount}%`;
    } else {
      desc = `Giảm ${formatCurrency(v.discountAmount)}`;
    }
    if (v.minOrderValue > 0) {
      desc += ` cho đơn từ ${formatCurrency(v.minOrderValue)}`;
    }
    return desc;
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Khuyến mãi" }]} />
      <PageHeader title="Khuyến mãi & Voucher" subtitle="Lưu mã ngay để dùng khi thanh toán" />

      <div className="container mx-auto px-4 pb-10 min-h-[40vh]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Đang tải danh sách khuyến mãi...</p>
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border shadow-sm">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-lg font-medium text-foreground">
              Chưa có chương trình khuyến mãi nào.
            </p>
            <p className="text-sm text-muted-foreground mt-1">Vui lòng quay lại sau.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {promos.map((v) => (
              <div
                key={v._id || v.code}
                className="flex gap-4 rounded-xl bg-card p-4 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1 hover:shadow-md border border-transparent hover:border-primary/20"
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-inner">
                  <Tag className="h-8 w-8" />
                </div>
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-bold text-foreground line-clamp-1" title={v.code}>
                      {v.code}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {getDesc(v)}
                    </p>
                    <p className="mt-1 text-xs text-primary font-medium">
                      HSD: {formatDate(v.expirationDate)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <code className="rounded bg-secondary/50 border px-2 py-1 text-xs font-bold font-mono truncate max-w-[120px]">
                      {v.code}
                    </code>
                    <button
                      onClick={() => handleCopy(v.code)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                        copiedCode === v.code
                          ? "bg-green-100 text-green-700"
                          : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                      }`}
                    >
                      {copiedCode === v.code ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Sao chép
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 pb-10 text-center text-sm border-t pt-6">
        <Link
          to="/"
          className="text-primary font-medium hover:underline flex items-center justify-center gap-1"
        >
          &larr; Về trang chủ
        </Link>
      </div>
    </>
  );
}
