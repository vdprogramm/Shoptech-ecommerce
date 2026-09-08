import { useState, useEffect } from "react";
import { Star, Calendar, MessageSquare, Loader2, Send } from "lucide-react";
import { reviewService, type IReview } from "@/lib/api/api-review";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for adding a new review
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const data = await reviewService.getReviewsByProduct(productId);
      setReviews(data || []);
    } catch (error) {
      console.error("Lỗi khi tải đánh giá:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    // Kiểm tra đăng nhập (đơn giản qua localStorage)
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      (() => {
        try {
          return (
            JSON.parse(localStorage.getItem("user") || "{}")?.token ||
            JSON.parse(localStorage.getItem("user") || "{}")?.accessToken
          );
        } catch (e) {
          return null;
        }
      })();

    if (!token) {
      setErrorMsg("Bạn cần đăng nhập để gửi đánh giá.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await reviewService.addReview({
        productId,
        rating,
        comment,
      });

      // Xoá form và tải lại danh sách
      setComment("");
      setRating(5);
      fetchReviews();
      showSuccessModal("Cảm ơn bạn đã đánh giá sản phẩm!");
    } catch (error: any) {
      console.error("Lỗi khi gửi đánh giá:", error);
      setErrorMsg(error.response?.data?.message || "Không thể gửi đánh giá lúc này.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 border-t max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-base font-black uppercase tracking-tight">
          Phản hồi khách hàng ({reviews.length})
        </h2>
      </div>

      {/* Form Viết Đánh Giá */}
      <form onSubmit={handleSubmitReview} className="mb-8 p-5 bg-card border rounded-xl shadow-sm">
        <h3 className="text-sm font-bold mb-3">Viết đánh giá của bạn</h3>

        {errorMsg && <p className="text-xs text-red-500 mb-3">{errorMsg}</p>}

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold">Chất lượng:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-5 w-5 ${star <= rating ? "fill-warning text-warning" : "text-gray-300"}`}
                />
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-2">{rating} / 5 sao</span>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
            className="flex-1 px-4 py-2 text-sm bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs uppercase rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Gửi
          </button>
        </div>
      </form>

      {/* Danh sách Đánh Giá */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-muted-foreground italic bg-secondary p-4 rounded-xl border border-dashed text-center">
          Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên nhận xét!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev._id} className="bg-card border p-4 rounded-xl shadow-sm flex gap-3">
              <img
                src={
                  rev.user?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                }
                alt="User"
                className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">
                    {rev.user?.fullName || rev.user?.username || "Khách hàng ẩn danh"}
                  </p>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(rev.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex text-warning gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < rev.rating ? "fill-current" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground pt-1">{rev.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
