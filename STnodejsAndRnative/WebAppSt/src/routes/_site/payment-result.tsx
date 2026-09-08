import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";
import { CheckCircle2, XCircle, ArrowRight, ShoppingBag, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_site/payment-result")({
  component: PaymentResult,
});

// Map mã lỗi VNPAY → thông báo tiếng Việt
const VNPAY_ERROR_MAP: Record<string, string> = {
  "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên hệ VNPAY để xử lý).",
  "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking tại ngân hàng.",
  "10": "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.",
  "11": "Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch.",
  "12": "Thẻ/Tài khoản bị khóa.",
  "13": "Quý khách nhập sai mật khẩu OTP. Vui lòng thực hiện lại.",
  "24": "Khách hàng đã hủy giao dịch.",
  "51": "Tài khoản của Quý khách không đủ số dư để thực hiện giao dịch.",
  "65": "Tài khoản đã vượt quá hạn mức giao dịch trong ngày.",
  "75": "Ngân hàng thanh toán đang bảo trì.",
  "79": "Nhập sai mật khẩu thanh toán quá số lần quy định.",
  "97": "Chữ ký giao dịch không hợp lệ.",
  "99": "Lỗi không xác định. Vui lòng liên hệ hỗ trợ.",
};

function PaymentResult() {
  const [status, setStatus] = useState<"success" | "failed" | "loading">("loading");
  const [orderCode, setOrderCode] = useState<string>(""); // vnp_TxnRef = orderCode (ORD...)
  const [rspCode, setRspCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    // Backend redirect: http://localhost:8080/payment-result?vnp_ResponseCode=00&vnp_TxnRef=ORD...&vnp_Amount=...&...
    const searchParams = new URLSearchParams(window.location.search);

    const code = searchParams.get("vnp_ResponseCode") || searchParams.get("rspCode");
    const txnRef = searchParams.get("vnp_TxnRef") || searchParams.get("orderId");
    const vnpAmount = searchParams.get("vnp_Amount");

    if (txnRef) setOrderCode(txnRef);
    if (code) setRspCode(code);

    // vnp_Amount từ VNPAY đã nhân 100, cần chia lại
    if (vnpAmount) {
      const realAmount = Number(vnpAmount) / 100;
      setAmount(realAmount.toLocaleString("vi-VN"));
    }

    if (!code) {
      setStatus("failed");
      setErrorMessage("Không tìm thấy thông tin giao dịch hợp lệ.");
      return;
    }

    if (code === "00") {
      setStatus("success");
    } else {
      setStatus("failed");
      setErrorMessage(VNPAY_ERROR_MAP[code] || `Giao dịch không thành công (Mã lỗi: ${code}).`);
    }
  }, []);

  return (
    <>
      <Breadcrumb
        items={[{ label: "Thanh toán", to: "/checkout" }, { label: "Kết quả giao dịch" }]}
      />
      <PageHeader title="Kết quả giao dịch" />

      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[50vh]">
        <div className="bg-card shadow-[var(--shadow-card)] border rounded-2xl p-8 md:p-12 max-w-lg w-full text-center">
          {/* LOADING */}
          {status === "loading" && (
            <div className="animate-pulse space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full mx-auto" />
              <div className="h-6 bg-muted rounded w-1/2 mx-auto" />
              <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
            </div>
          )}

          {/* SUCCESS */}
          {status === "success" && (
            <div className="animate-in zoom-in duration-500 fade-in space-y-6">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-foreground">
                  Thanh toán thành công!
                </h2>
                <p className="text-muted-foreground text-sm">
                  Cảm ơn bạn đã mua hàng. Đơn hàng đang được xử lý.
                </p>
              </div>

              {/* Thông tin giao dịch */}
              <div className="bg-secondary/30 border border-dashed rounded-xl p-4 space-y-2 text-left">
                {orderCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mã giao dịch</span>
                    <span className="font-mono font-bold text-foreground tracking-wider">
                      {orderCode}
                    </span>
                  </div>
                )}
                {amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Số tiền thanh toán</span>
                    <span className="font-bold text-primary">{amount}₫</span>
                  </div>
                )}
                {rspCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mã phản hồi</span>
                    <span className="font-mono text-green-600 font-semibold">{rspCode}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/account/orders"
                  className="rounded-xl bg-primary text-primary-foreground px-6 py-3 font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4" /> Xem đơn hàng
                </Link>
                <Link
                  to="/"
                  className="rounded-xl bg-secondary text-secondary-foreground border px-6 py-3 font-bold hover:bg-muted transition-colors flex items-center justify-center gap-2"
                >
                  Tiếp tục mua sắm <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* FAILED */}
          {status === "failed" && (
            <div className="animate-in zoom-in duration-500 fade-in space-y-6">
              <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <XCircle className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-foreground">
                  Thanh toán thất bại
                </h2>
                <p className="text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100 text-sm">
                  {errorMessage}
                </p>
              </div>

              {/* Thông tin giao dịch lỗi */}
              {(orderCode || rspCode) && (
                <div className="bg-secondary/30 border border-dashed rounded-xl p-4 space-y-2 text-left">
                  {orderCode && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mã giao dịch</span>
                      <span className="font-mono font-bold text-foreground">{orderCode}</span>
                    </div>
                  )}
                  {rspCode && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mã lỗi</span>
                      <span className="font-mono text-red-500 font-semibold">{rspCode}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate({ to: "/checkout" })}
                  className="rounded-xl bg-primary text-primary-foreground px-6 py-3 font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <ReceiptText className="w-4 h-4" /> Thử thanh toán lại
                </button>
                <Link
                  to="/"
                  className="rounded-xl bg-secondary text-secondary-foreground border px-6 py-3 font-bold hover:bg-muted transition-colors flex items-center justify-center gap-2"
                >
                  Về trang chủ
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
