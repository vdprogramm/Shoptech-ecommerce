import * as Icons from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { categoryService, Category } from "@/lib/api/api-category";

// Hàm helper sinh slug đồng bộ với Header
const convertToSlug = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

// Hàm ánh xạ an toàn tên text nhận về từ trường .image sang Lucide Component
const resolveLucideIcon = (imageFieldName: string, categoryName: string) => {
  // Nếu trường image lưu đúng tên Component Lucide (ví dụ: "Smartphone", "Laptop")
  if (imageFieldName && (Icons as any)[imageFieldName]) {
    const Component = (Icons as any)[imageFieldName];
    return <Component className="h-6 w-6" />;
  }

  // Tự động đoán từ khóa phòng hờ nếu trường image bị bỏ trống
  const nameLower = categoryName.toLowerCase();
  if (nameLower.includes("điện thoại")) return <Icons.Smartphone className="h-6 w-6" />;
  if (nameLower.includes("laptop")) return <Icons.Laptop className="h-6 w-6" />;
  if (nameLower.includes("tablet") || nameLower.includes("bảng"))
    return <Icons.Tablet className="h-6 w-6" />;
  if (nameLower.includes("tai nghe") || nameLower.includes("âm thanh"))
    return <Icons.Headphones className="h-6 w-6" />;
  if (nameLower.includes("đồng hồ")) return <Icons.Watch className="h-6 w-6" />;
  if (nameLower.includes("máy ảnh")) return <Icons.Camera className="h-6 w-6" />;
  if (nameLower.includes("tivi") || nameLower.includes("màn hình"))
    return <Icons.Tv className="h-6 w-6" />;
  if (nameLower.includes("game") || nameLower.includes("gaming"))
    return <Icons.Gamepad2 className="h-6 w-6" />;
  if (nameLower.includes("linh kiện") || nameLower.includes("cpu"))
    return <Icons.Cpu className="h-6 w-6" />;

  return <Icons.Home className="h-6 w-6" />; // Trả về icon mặc định
};

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    categoryService
      .getAllCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.error("Lỗi lấy danh mục grid:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-xl bg-card p-3 animate-pulse"
            >
              <div className="w-12 h-12 rounded-full bg-secondary" />
              <div className="w-16 h-3 bg-secondary rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
        {categories.map((category) => {
          const generatedSlug = convertToSlug(category.name);

          return (
            <Link
              key={category._id}
              to="/category/$slug"
              params={{ slug: generatedSlug }}
              search={{ id: category._id } as any} // Truyền kèm ID danh mục lên URL làm bệ phóng cho API lọc sản phẩm sau này
              className="group flex flex-col items-center gap-2 rounded-xl bg-card p-3 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] text-card-foreground"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                {/* Gọi hàm map icon động dựa trên trường .image */}
                {resolveLucideIcon(category.image || "", category.name)}
              </div>
              <span className="text-xs font-medium text-foreground text-center line-clamp-1">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
