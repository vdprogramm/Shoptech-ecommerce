import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";
import { ProductCard } from "@/components/site/ProductCard";
import { flashProducts, newProducts, bestSellers } from "@/lib/mock-products";

const search = z.object({ q: z.string().optional().default("") });

export const Route = createFileRoute("/_site/search")({
  validateSearch: search.parse,
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const all = [...flashProducts, ...newProducts, ...bestSellers];
  const results = q ? all.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())) : all;

  return (
    <>
      <Breadcrumb items={[{ label: "Tìm kiếm" }]} />
      <PageHeader
        title={q ? `Kết quả cho "${q}"` : "Tất cả sản phẩm"}
        subtitle={`Tìm thấy ${results.length} sản phẩm`}
      />
      <div className="container mx-auto px-4 pb-10">
        {results.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Không tìm thấy sản phẩm.{" "}
            <Link to="/" className="text-primary">
              Về trang chủ
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {results.map((p) => (
              <ProductCard key={p._id} p={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
