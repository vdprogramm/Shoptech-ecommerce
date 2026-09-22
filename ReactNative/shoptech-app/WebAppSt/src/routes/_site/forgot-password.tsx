import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { authService } from "@/lib/api/api-auth"; // Sử dụng service đã khai báo

export const Route = createFileRoute("/_site/forgot-password")({
  component: ForgotPasswordComponent,
});

function ForgotPasswordComponent() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Gọi lên Backend NestJS thông qua productService
      await authService.forgotPassword(email);
      setIsSuccess(true);
    } catch (err: any) {
      // Trả ra lỗi nếu email không tồn tại hoặc lỗi server
      setError(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
        {!isSuccess ? (
          <>
            <h1 className="text-2xl font-bold text-center">Quên mật khẩu</h1>
            <p className="text-center text-sm text-muted-foreground mt-1">
              Nhập email để nhận liên kết khôi phục
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                placeholder="Email"
              />

              {/* Hiển thị thông báo lỗi (nếu có) */}
              {error && <p className="text-xs text-destructive font-medium text-center">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Đang xử lý..." : "Gửi yêu cầu"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4 space-y-3">
            <h1 className="text-xl font-bold text-green-600">Kiểm tra Email</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Liên kết đặt lại mật khẩu đã được gửi tới <br />
              <span className="font-semibold text-foreground">{email}</span>. <br />
              Vui lòng kiểm tra hộp thư (hoặc thư rác) trong vòng 15 phút.
            </p>
          </div>
        )}

        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="text-primary hover:underline">
            ← Về đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
