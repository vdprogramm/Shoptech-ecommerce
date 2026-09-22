import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { authService } from "@/lib/api/api-auth";

// Cấu hình nhận diện Search Param "?token=XYZ" từ URL qua TanStack Router
export const Route = createFileRoute("/_site/reset-password")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || "",
    };
  },
  component: ResetPasswordComponent,
});

function ResetPasswordComponent() {
  const { token } = Route.useSearch(); // Trích xuất Token từ URL xuống
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Kiểm tra độ dài mật khẩu phía Client
    if (password.length < 6) {
      setError("Mật khẩu mới phải chứa ít nhất 6 ký tự.");
      return;
    }

    // Kiểm tra khớp mật khẩu
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    if (!token) {
      setError("Mã Token xác thực không tìm thấy hoặc đã bị sửa đổi.");
      return;
    }

    setIsLoading(true);
    try {
      // Đẩy Token cùng PasswordMoi lên cổng Backend NestJS
      await authService.resetPassword(token, password);
      setIsSuccess(true);

      // Tự động chuyển hướng về trang đăng nhập sau 3 giây khi thành công
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Liên kết khôi phục đã hết hạn hoặc không hợp lệ.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
        {!isSuccess ? (
          <>
            <h1 className="text-2xl font-bold text-center">Đặt lại mật khẩu</h1>
            <p className="text-center text-sm text-muted-foreground mt-1">
              Nhập mật khẩu mới cho tài khoản ShopTech của bạn
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              {/* Ô nhập mật khẩu mới */}
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
              />

              {/* Ô nhập lại mật khẩu */}
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                placeholder="Xác nhận mật khẩu mới"
              />

              {/* Hiển thị lỗi thông báo (nếu có) */}
              {error && <p className="text-xs text-destructive font-medium text-center">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4 space-y-3">
            <h1 className="text-xl font-bold text-green-600">Thành công!</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mật khẩu mới của bạn đã được cập nhật thành công. <br />
              Hệ thống đang tự động chuyển hướng bạn về trang Đăng nhập...
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
