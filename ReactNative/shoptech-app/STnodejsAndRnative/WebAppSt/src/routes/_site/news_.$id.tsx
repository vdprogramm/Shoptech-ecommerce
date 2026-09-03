import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";
import { newsService, INews } from "@/lib/api/api-news";
import { BASE_URL } from "@/lib/api/axios-client";

export const Route = createFileRoute("/_site/news_/$id")({
  component: NewsDetailPage,
});

function NewsDetailPage() {
  const { id } = Route.useParams();
  const [news, setNews] = useState<INews | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        const data = await newsService.getNewsById(id);
        setNews(data);
      } catch (err) {
        console.error("Lỗi khi tải chi tiết tin tức:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNewsDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Đang tải nội dung...</p>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy tin tức</h2>
        <p className="text-muted-foreground mb-8">
          Tin tức này có thể đã bị xóa hoặc không tồn tại.
        </p>
        <button
          onClick={() => window.history.back()}
          className="bg-primary text-white px-6 py-2 rounded-lg font-medium"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: "Tin công nghệ", href: "/news" }, { label: news.title }]} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card text-card-foreground rounded-2xl p-6 md:p-10 shadow-xl border">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{news.title}</h1>

          <div className="text-sm text-muted-foreground mb-8">
            Đăng ngày:{" "}
            {new Date(news.createdAt).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          {news.imageUrl && (
            <img
              src={`${BASE_URL}${news.imageUrl}`}
              alt={news.title}
              className="w-full rounded-2xl mb-8 object-cover max-h-[500px]"
            />
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none prose-img:rounded-xl prose-img:mx-auto prose-a:text-primary">
            <div dangerouslySetInnerHTML={{ __html: news.content }} />
          </div>
        </div>
      </div>
    </>
  );
}
