import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ProductCard, type Product } from "./ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ProductSection({
  title,
  products,
  slug = "tat-ca",
  itemsPerPage = 10,
}: {
  title: string;
  products: Product[]; // Nhận danh sách Array Product từ database
  slug?: string;
  itemsPerPage?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);

  // Tự động reset trang về 1 khi danh sách sản phẩm thay đổi (ví dụ: khi chọn thương hiệu khác)
  useEffect(() => {
    setCurrentPage(1);
  }, [products]);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <Link
          to="/category/$slug"
          params={{ slug }}
          className="text-sm font-medium text-primary hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-10 border rounded-xl text-xs text-muted-foreground bg-card">
          Không có sản phẩm nào thuộc mục này.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {currentProducts.map((p) => (
              <ProductCard key={p._id} p={p} /> // 🔴 Đổi key định danh sang p._id
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="flex h-9 items-center justify-center gap-1 rounded-xl border border-input bg-card px-3 text-xs font-bold text-foreground transition-all hover:bg-secondary hover:text-secondary-foreground disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Trang trước</span>
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 w-9 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs ${
                      currentPage === page
                        ? "border-primary bg-primary text-primary-foreground font-black scale-105 shadow-sm shadow-primary/20"
                        : "border-input bg-card hover:bg-secondary text-foreground"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="flex h-9 items-center justify-center gap-1 rounded-xl border border-input bg-card px-3 text-xs font-bold text-foreground transition-all hover:bg-secondary hover:text-secondary-foreground disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <span>Trang sau</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
