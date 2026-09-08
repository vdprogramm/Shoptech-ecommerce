import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Breadcrumb, PageHeader } from "@/components/site/PageHeader";
import { ProductCard, type Product } from "@/components/site/ProductCard";
import { categoryService } from "@/lib/api/api-category";
import { productService } from "@/lib/api/api-product";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_site/category/$slug")({
  component: CategoryPage,
});

/**
 * Hàm chuẩn hóa chuỗi để so sánh chính xác giữa URL và Database
 * Chuyển tất cả về chữ thường, xóa sạch dấu tiếng Việt, xóa gạch ngang và khoảng trắng
 */
function cleanStringForCompare(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[-_\s]/g, "");
}

function CategoryPage() {
  const { slug } = Route.useParams();

  const [categoryName, setCategoryName] = useState("Danh mục");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Trạng thái phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset trang về 1 khi slug (danh mục) hoặc danh sách sản phẩm thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [slug, products]);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setIsLoading(true);

        // 1. Xử lý các bộ lọc đặc biệt (Tất cả, Mới, Bán chạy)
        const cleanSlug = cleanStringForCompare(slug);
        if (cleanSlug === "tatca" || cleanSlug === "moi" || cleanSlug === "banchay") {
          const allProducts = await productService.getProducts({ isAvailable: true });

          if (cleanSlug === "moi") {
            setCategoryName("Sản phẩm mới");
            setProducts([...allProducts].reverse());
          } else if (cleanSlug === "banchay") {
            setCategoryName("Bán chạy nhất");
            setProducts(
              [...allProducts].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)),
            );
          } else {
            setCategoryName("Tất cả sản phẩm");
            setProducts(allProducts);
          }
          return;
        }

        // 2. Lấy toàn bộ danh mục từ NestJS về để so sánh
        const categories = await categoryService.getAllCategories();

        // So sánh chuỗi đã dọn sạch để tìm danh mục trùng khớp bất kể DB lưu kiểu gì
        const targetCategory = categories.find(
          (cat) => cleanStringForCompare(cat.name) === cleanStringForCompare(slug),
        );

        if (targetCategory) {
          // Cập nhật lại tiêu đề đúng theo DB (Ví dụ: "Laptop Gaming")
          setCategoryName(targetCategory.name);

          // 3. Gọi API NestJS lọc sản phẩm theo đúng _id MongoDB của danh mục đó
          const filteredProducts = await productService.getProducts({
            category: targetCategory._id,
            isAvailable: true,
          });
          setProducts(filteredProducts);
        } else {
          setCategoryName("Không tìm thấy danh mục");
          setProducts([]);
        }
      } catch (error) {
        console.error("Lỗi khi kết nối sản phẩm theo danh mục:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [slug]);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      <Breadcrumb items={[{ label: "Danh mục", to: "/category/$slug" }, { label: categoryName }]} />
      <PageHeader
        title={categoryName}
        subtitle={isLoading ? "Đang tải..." : `${products.length} sản phẩm`}
      />

      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 pb-10 text-card-foreground">
        {/* Sidebar Bộ lọc */}
        <aside className="rounded-xl border bg-card p-4 h-fit space-y-4 text-sm shadow-sm">
          <div>
            <h3 className="font-bold text-foreground mb-2">Khoảng giá</h3>
            {["Dưới 5 triệu", "5 - 10 triệu", "10 - 20 triệu", "Trên 20 triệu"].map((r) => (
              <label
                key={r}
                className="flex items-center gap-2 py-1 text-muted-foreground cursor-pointer hover:text-foreground"
              >
                <input type="checkbox" className="rounded border-gray-300 text-primary" /> {r}
              </label>
            ))}
          </div>
          <div>
            <h3 className="font-bold text-foreground mb-2">Thương hiệu</h3>
            {["Apple", "Samsung", "Xiaomi", "ASUS", "Sony"].map((b) => (
              <label
                key={b}
                className="flex items-center gap-2 py-1 text-muted-foreground cursor-pointer hover:text-foreground"
              >
                <input type="checkbox" className="rounded border-gray-300 text-primary" /> {b}
              </label>
            ))}
          </div>
        </aside>

        {/* Lưới sản phẩm */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground font-medium">
              Đang bóc tách kho hàng...
            </span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 border rounded-xl text-xs text-muted-foreground bg-card">
            Chưa có sản phẩm dữ liệu thật nào thuộc danh mục này trên NestJS.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-fit">
              {currentProducts.map((p) => (
                <ProductCard key={p._id} p={p} />
              ))}
            </div>

            {/* Nút điều hướng phân trang */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex h-9 items-center justify-center gap-1 rounded-xl border border-input bg-card px-3 text-xs font-bold text-foreground transition-all hover:bg-secondary hover:text-secondary-foreground disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <span>Trang sau</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
