import { Link } from "@tanstack/react-router";

import { ShieldCheck, Truck, HeadphonesIcon, CreditCard, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer
      className="mt-auto text-white shadow-inner relative z-10 overflow-hidden"
      style={{ background: "var(--gradient-header, #d30000)" }}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/20 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3"></div>

      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-8 relative z-10">
        {/* Decorative Guarantee Icons Row */}
        <div className="flex justify-center gap-10 sm:gap-16 mb-2 opacity-80">
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="h-8 w-8" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
              Chính Hãng
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Truck className="h-8 w-8" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
              Freeship
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <HeadphonesIcon className="h-8 w-8" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
              Hỗ Trợ 24/7
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CreditCard className="h-8 w-8" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
              Thanh Toán An Toàn
            </span>
          </div>
        </div>

        {/* Brand & Slogan */}
        <div className="text-center relative">
          <div className="absolute -top-5 -right-6 text-yellow-300 animate-pulse">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-5xl font-black tracking-tight text-white drop-shadow-xl">ShopTech</h2>
          <div className="mt-5 flex items-center justify-center gap-2">
            <div className="h-1.5 w-3 rounded-full bg-white/40"></div>
            <div className="h-1.5 w-10 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
            <div className="h-1.5 w-3 rounded-full bg-white/40"></div>
          </div>
          <p className="text-sm font-medium text-white/90 mt-6 max-w-md mx-auto leading-relaxed drop-shadow-sm">
            Khám phá kỷ nguyên công nghệ mới với các thiết bị điện tử chính hãng hàng đầu. Trải
            nghiệm mua sắm thông minh, an toàn và tối ưu.
          </p>
        </div>
      </div>

      <div className="border-t border-white/20 py-5 text-center text-xs font-medium text-white/80 bg-black/10 relative z-10">
        © {new Date().getFullYear()} ShopTech - All rights reserved.
      </div>
    </footer>
  );
}
