import { useState, useEffect } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";
import { newsService, INews } from "@/lib/api/api-news";
import { BASE_URL } from "@/lib/api/axios-client";

export const Route = createFileRoute("/_site/news")({
  component: NewsPage,
});

function NewsPage() {
  const [news, setNews] = useState<INews[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await newsService.getAllNews();
        setNews(data);
      } catch (err) {
        console.error("Lỗi khi tải tin tức:", err);
      }
    };
    fetchNews();
  }, []);

  return (
    <>
      <Breadcrumb items={[{ label: "Tin công nghệ" }]} />
      <PageHeader title="Tin công nghệ" />
      <div className="container mx-auto px-4 pb-10 grid md:grid-cols-3 gap-4">
        {news.map((n) => (
          <Link
            key={n._id}
            to="/news/$id"
            params={{ id: n._id }}
            className="rounded-xl bg-card p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition cursor-pointer"
          >
            {/* Đã bọc điều kiện để tránh truyền ảnh rỗng */}
            {n.imageUrl ? (
              <img
                src={`${BASE_URL}${n.imageUrl}`}
                alt={n.title}
                className="aspect-video rounded-lg bg-secondary mb-3 object-cover w-full"
              />
            ) : (
              <div className="aspect-video rounded-lg bg-secondary mb-3 flex items-center justify-center w-full text-muted-foreground text-sm">
                Chưa có ảnh
              </div>
            )}

            <h3 className="font-bold mb-2">{n.title}</h3>
            <p className="text-sm text-muted-foreground">{n.excerpt}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
