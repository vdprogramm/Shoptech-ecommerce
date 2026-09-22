import { useConfirm } from "@/hooks/use-confirm";
import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { newsService, type INews } from "@/lib/api/api-news";
import { BASE_URL } from "@/lib/api/axios-client";
import { Plus, Trash2, Edit } from "lucide-react";
import { NewsForm } from "@/routes/_site/admin/-components/NewsForm";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/admin/news")({
  component: AdminNewsPage,
});

function AdminNewsPage() {
  const { confirm } = useConfirm();
  const [newsList, setNewsList] = useState<INews[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<INews | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadNews = async () => {
    const newsData = await newsService.getAllNews();
    setNewsList(newsData);
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleDelete = async (id: string) => {
    if (await confirm("Bạn có chắc chắn muốn xóa tin tức này không?")) {
      try {
        await newsService.deleteNews(id);
        loadNews();
      } catch (error) {
        console.error("Lỗi khi xóa tin tức:", error);
        toast.error("Đã xảy ra lỗi khi xóa tin tức!");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-black">QUẢN LÝ TIN TỨC</h1>
        <button
          onClick={() => {
            setEditingNews(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold"
        >
          <Plus size={16} /> Thêm tin mới
        </button>
      </div>

      {isFormOpen && (
        <NewsForm
          initialData={editingNews}
          onClose={() => {
            setIsFormOpen(false);
            setEditingNews(null);
            loadNews();
          }}
        />
      )}

      <div className="grid gap-4">
        {/* Đã thay n: any bằng n: INews */}
        {newsList
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((n: INews) => (
            <div key={n._id} className="flex gap-4 p-4 border rounded-xl items-center">
              {/* Đã bọc điều kiện để tránh truyền ảnh rỗng */}
              {n.imageUrl ? (
                <img
                  src={`${BASE_URL}${n.imageUrl}`}
                  className="w-20 h-20 object-cover rounded-lg bg-secondary"
                  alt={n.title}
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center text-[10px] text-muted-foreground text-center">
                  Chưa có ảnh
                </div>
              )}

              <div className="flex-1">
                <h3 className="font-bold">{n.title}</h3>
                <p className="text-xs text-muted-foreground">{n.excerpt}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingNews(n);
                    setIsFormOpen(true);
                  }}
                  className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(n._id)}
                  className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
      </div>

      {newsList.length > itemsPerPage && (
        <div className="flex items-center justify-between mt-4 py-3 border-t">
          <span className="text-sm text-muted-foreground">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, newsList.length)} trên tổng {newsList.length} tin
            tức
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium border rounded-md disabled:opacity-50 hover:bg-muted bg-background"
            >
              Trước
            </button>
            <span className="text-sm font-medium px-2">
              Trang {currentPage} / {Math.ceil(newsList.length / itemsPerPage)}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, Math.ceil(newsList.length / itemsPerPage)),
                )
              }
              disabled={currentPage === Math.ceil(newsList.length / itemsPerPage)}
              className="px-3 py-1.5 text-sm font-medium border rounded-md disabled:opacity-50 hover:bg-muted bg-background"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
