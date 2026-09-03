import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { authService } from "@/lib/api/api-auth";
import { GoogleLogin } from "@react-oauth/google";

export const Route = createFileRoute("/_site/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("accessToken", token);
      try {
        const base64Url = token.split(".")[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            window
              .atob(base64)
              .split("")
              .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join(""),
          );
          const user = JSON.parse(jsonPayload);
          localStorage.setItem("user", JSON.stringify(user));
        }
      } catch (e) {
        console.error("Lỗi parse JWT token từ URL:", e);
      }
      navigate({ to: "/" });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Vui lòng điền đầy đủ thông tin đăng nhập.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await authService.login({
        email: email,
        password: password,
      });

      const token = data.accessToken || data.token;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("accessToken", token);

        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        navigate({ to: "/" });
      } else {
        setError("Đăng nhập thành công nhưng hệ thống không trả về mã xác thực.");
      }
    } catch (err: any) {
      console.error("Lỗi đăng nhập:", err);
      setError(
        err.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu!",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await authService.googleLogin(credentialResponse.credential);
      const token = data.accessToken || data.token;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("accessToken", token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        navigate({ to: "/" });
      }
    } catch (err: any) {
      console.error("Lỗi đăng nhập Google:", err);
      setError(err.response?.data?.message || "Đăng nhập Google thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50/50 dark:bg-zinc-950/50">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-rose-400/10 dark:bg-rose-900/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-blue-400/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md z-10 relative">
        <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-[2.5rem] z-0" />
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.4)] border border-white/60 dark:border-white/10 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent mb-2">
              Chào mừng trở lại!
            </h1>
            <p className="text-muted-foreground text-sm">
              Đăng nhập để tiếp tục mua sắm tại ShopTech
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center">
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground/70" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="block w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background/50 hover:bg-background/80 focus:bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 outline-none sm:text-sm"
                  placeholder="nhapemail@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="block text-sm font-medium text-foreground">Mật khẩu</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground/70" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="block w-full pl-11 pr-12 py-3 rounded-xl border border-border bg-background/50 hover:bg-background/80 focus:bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 outline-none sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-rose-500 py-3.5 font-bold text-white shadow-[0_4px_14px_0_rgb(203,28,34,0.39)] hover:shadow-[0_6px_20px_rgba(203,28,34,0.23)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground">Hoặc tiếp tục với</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Đăng nhập Google thất bại.")}
              shape="rectangular"
              theme="outline"
              size="large"
              text="signin_with"
            />

            <button
              type="button"
              onClick={() =>
                (window.location.href = `${import.meta.env.VITE_API_URL}/auth/twitter?client=web`)
              }
              className="w-full max-w-[280px] flex justify-center items-center gap-2 bg-[#000000] text-white py-2.5 rounded-lg border border-transparent shadow-md hover:bg-zinc-800 hover:shadow-lg transition-all duration-200 h-[44px] font-semibold"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.244 2.25H21.552L14.325 10.51L22.827 21.75H16.17L10.956 14.933L4.99 21.75H1.68L9.41 12.915L1.254 2.25H8.08L12.793 8.481L18.244 2.25ZM17.083 19.77H18.916L7.084 4.126H5.117L17.083 19.77Z"
                  fill="white"
                />
              </svg>
              Đăng nhập với X
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
