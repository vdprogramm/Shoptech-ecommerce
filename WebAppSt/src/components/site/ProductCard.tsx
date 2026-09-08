import { Star, Heart, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getImageUrl } from "@/lib/utils";
import { useState } from "react";
import { wishlistsService } from "@/lib/api/api-wishlist";

// 🔴 CẬP NHẬT INTERFACE KHỚP 100% MONGOOSE SCHEMA
export interface Product {
  _id: string; // Khớp với trường tự sinh của MongoDB
  name: string;
  images: string[]; // Backend lưu mảng string [String]
  price: number;
  originalPrice?: number; // Nếu database chưa có, nó sẽ mặc định không hiển thị giá cũ
  averageRating: number; // Khớp @Prop({ default: 0 }) averageRating
  reviewCount: number; // Khớp @Prop({ default: 0 }) reviewCount (Dùng thay cho sold nếu chưa có trường sold)
  isAvailable: boolean; // Khớp trạng thái mở bán
  stock: number;
  badge?: string;
  variants?: string[];
  brand?: any;
  store?: any; // Lưu thông tin cửa hàng (populated object hoặc string ID)
}

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "₫";

export function ProductCard({
  p,
  isLikedDefault = false,
}: {
  p: Product;
  isLikedDefault?: boolean;
}) {
  // Quản lý state thả tim
  const [isLiked, setIsLiked] = useState(isLikedDefault);
  const [isLiking, setIsLiking] = useState(false);

  // Tính toán phần trăm giảm giá dựa trên giá gốc và giá bán
  const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

  // Lấy tấm ảnh đầu tiên trong mảng images, nếu mảng rỗng thì dùng ảnh fallback mặc định
  const displayImage =
    p.images && p.images.length > 0
      ? p.images[0]
      : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500";

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Ngăn chặn sự kiện click chuyển hướng của Link
    e.stopPropagation(); // Ngăn chặn sự kiện nổi bọt

    try {
      setIsLiking(true);
      await wishlistsService.toggleWishlist(p._id);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái yêu thích:", error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Link
      to="/product/$id"
      params={{ id: p._id }} // 🔴 Chuyển sang dùng p._id của MongoDB
      className={`group relative flex flex-col overflow-hidden rounded-xl bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] ${
        !p.isAvailable || p.stock === 0 ? "opacity-75" : ""
      }`}
    >
      {/* Badge đi kèm hệ thống */}
      {p.badge && (
        <span className="absolute left-2 top-2 z-10 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
          {p.badge}
        </span>
      )}

      {/* Badge hết hàng nếu tồn kho bằng 0 */}
      {p.stock === 0 && (
        <span className="absolute left-2 top-2 z-10 rounded-md bg-gray-500 px-2 py-0.5 text-[10px] font-bold text-white">
          Hết hàng
        </span>
      )}

      {discount > 0 && (
        <span className="absolute left-2 top-8 z-10 rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
          -{discount}%
        </span>
      )}

      {/* Nút Thả tim (Wishlist) */}
      <button
        onClick={handleToggleWishlist}
        disabled={isLiking}
        className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-red-500 hover:scale-110 active:scale-95 disabled:opacity-50"
      >
        {isLiking ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
        )}
      </button>

      {/* Box hiển thị ảnh */}
      <div className="aspect-square overflow-hidden bg-white flex items-center justify-center p-2">
        <img
          src={getImageUrl(displayImage)} // 🔴 Sử dụng ảnh bóc tách từ mảng
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co/500x500?text=No+Image";
          }}
        />
      </div>

      {/* Thông tin sản phẩm */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {/* Tên cửa hàng sở hữu */}
        {p.store && typeof p.store === "object" && p.store.name && (
          <div className="flex items-center gap-1.5 mb-0.5">
            {p.store.logoUrl ? (
              <img
                src={getImageUrl(p.store.logoUrl)}
                alt={p.store.name}
                className="w-4 h-4 rounded-full object-cover border border-muted"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex w-4 h-4 items-center justify-center rounded-full bg-muted text-[8px]">
                🏪
              </div>
            )}
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">
              {p.store.name}
            </div>
          </div>
        )}

        <h3 className="line-clamp-2 min-h-10 text-sm font-medium text-foreground">{p.name}</h3>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-primary">{formatVND(p.price)}</span>
          {p.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatVND(p.originalPrice)}
            </span>
          )}
        </div>

        {/* Đánh giá sao và lượt tương tác */}
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5 text-warning">
            <Star className="h-3 w-3 fill-current" />
            {/* 🔴 Sử dụng averageRating từ NestJS */}
            <span className="text-foreground">{(p.averageRating || 0).toFixed(1)}</span>
          </span>
          {/* 🔴 Sử dụng reviewCount làm số lượng tương tác */}
          <span>Đánh giá ({p.reviewCount || 0})</span>
        </div>
      </div>
    </Link>
  );
}
