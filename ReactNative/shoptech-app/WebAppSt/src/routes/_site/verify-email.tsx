import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
// Import dịch vụ API auth tập trung mà chúng ta đã cấu hình
import { authService } from "@/lib/api/api-auth";

// Định nghĩa kiểu dữ liệu cho Query Parameters trên URL (Phục vụ truyền dữ liệu tự động nếu cần)
interface VerifySearchSchema {
  email?: string;
}

export const Route = createFileRoute("/_site/verify-email")({
  // Tích hợp tính năng bóc tách search params tự động của TanStack Router
  validateSearch: (search: Record<string, unknown>): VerifySearchSchema => {
    return {
      email: search.email as string | undefined,
    };
  },
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  // Lấy email mặc định từ URL nếu có (ví dụ từ trang Register đá qua bằng nút bấm)
  const { email: defaultEmail } = Route.useSearch();

  const [email, setEmail] = useState(defaultEmail || "");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !otp.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin Email và mã số xác thực OTP.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 🔴 GỌI API XÁC THỰC TẬP TRUNG: POST lên http://localhost:3001/users/verify-email
      await authService.verifyEmail(email, otp);

      setSuccess("Kích hoạt tài khoản thành công! Đang chuyển hướng bạn về trang đăng nhập...");

      // Chờ 2 giây để người dùng đọc thông báo thành công trước khi redirect
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 2000);
    } catch (err: any) {
      console.error("Lỗi xác thực mã OTP:", err);
      setError(
        err.response?.data?.message ||
          "Mã OTP không chính xác, đã hết hạn hoặc tài khoản đã được kích hoạt trước đó!",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)] border">
        {/* Khối tiêu đề */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Xác thực tài khoản</h1>
          <p className="text-xs text-muted-foreground mt-1 px-4">
            Nhập mã bảo mật OTP được gửi tới hòm thư Email của bạn để hoàn tất quy trình kích hoạt.
          </p>
        </div>

        {/* Khối thông báo trạng thái phản hồi từ Backend */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm text-center font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form nhập liệu */}
        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-card-foreground/80 block mb-1">
              Địa chỉ Email tài khoản
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || !!defaultEmail} // Nếu truyền tự động qua URL thì khóa input email lại cho chuyên nghiệp
              placeholder="Nhập địa chỉ email đăng ký"
              className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm disabled:opacity-75 disabled:bg-secondary/40"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-card-foreground/80 block mb-1">
              Mã xác thực bảo mật (OTP)
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={isLoading}
              placeholder="Nhập 6 số OTP"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-center font-mono text-lg tracking-[0.2em] font-bold outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 uppercase placeholder:tracking-normal placeholder:text-sm placeholder:font-normal"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 mt-2 cursor-pointer"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Đang xử lý thông tin..." : "Xác nhận kích hoạt"}
          </button>
        </form>

        {/* Khối link bổ trợ chân trang */}
        <div className="mt-5 text-center text-xs text-muted-foreground flex items-center justify-between px-1">
          <Link to="/register" className="hover:text-primary transition hover:underline">
            ← Đăng ký tài khoản mới
          </Link>
          <Link to="/login" className="hover:text-primary transition hover:underline">
            Đăng nhập ứng dụng →
          </Link>
        </div>
      </div>
    </div>
  );
}
