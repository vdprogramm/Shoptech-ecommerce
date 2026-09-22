import { useState, useRef, useEffect } from "react";
import { newsService, INews } from "@/lib/api/api-news";
import { BASE_URL } from "@/lib/api/axios-client";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

export function NewsForm({
  onClose,
  initialData,
}: {
  onClose: () => void;
  initialData?: INews | null;
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    initialData?.imageUrl ? `${BASE_URL}${initialData.imageUrl}` : null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    } else {
      setPreview(null);
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: Bắt buộc điền đủ thông tin, tránh gửi dữ liệu rỗng lên Backend gây lỗi 400
    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.content.trim()) {
      toast.error("Vui lòng nhập đầy đủ Tiêu đề, Tóm tắt và Nội dung chi tiết!");
      return;
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("excerpt", formData.excerpt);
    data.append("content", formData.content);
    if (file) {
      data.append("file", file);
    }

    try {
      if (initialData) {
        await newsService.updateNews(initialData._id, data);
        showSuccessModal("Đã cập nhật tin tức thành công!");
      } else {
        await newsService.createNews(data);
        showSuccessModal("Đã thêm tin tức thành công!");
      }
      onClose();
    } catch (error) {
      console.error("Lỗi khi lưu tin:", error);
      toast.error("Có lỗi xảy ra, vui lòng kiểm tra console!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-xl w-full max-w-lg shadow-xl">
        <h2 className="text-lg font-bold mb-4">
          {initialData ? "Cập nhật tin tức" : "Thêm tin tức mới"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-2 border rounded"
            placeholder="Tiêu đề"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="Tóm tắt"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          />
          <textarea
            className="w-full p-2 border rounded h-24"
            placeholder="Nội dung chi tiết"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Ảnh đại diện (Thumbnail)</label>
            {preview ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border group">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 hover:border-primary transition-colors"
              >
                <ImagePlus size={32} className="mb-2 text-gray-400" />
                <span className="text-sm">Click để chọn ảnh</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded">
              Lưu tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
