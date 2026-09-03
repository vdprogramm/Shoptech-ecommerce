import { useConfirm } from "@/hooks/use-confirm";
import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { apiAdminReview, IAdminReview } from "../../../lib/api/admin/api-admin-review";
import { adminProductService } from "../../../lib/api/admin/api-admin-product";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { showSuccessModal } from "@/components/ui/GlobalSuccessModal";

export const Route = createFileRoute("/_site/admin/reviews")({
  component: AdminReviewsPage,
});

function AdminReviewsPage() {
  const { confirm } = useConfirm();
  const [reviews, setReviews] = useState<IAdminReview[]>([]);
  const [storesMap, setStoresMap] = useState<Record<string, string>>({});
  const [productStoreMap, setProductStoreMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchReviewsAndStores = async () => {
    setLoading(true);
    try {
      const [reviewsData, storesData, productsData] = await Promise.all([
        apiAdminReview.getAllReviews(),
        adminProductService.getStores().catch(() => []),
        adminProductService.getProducts().catch(() => []),
      ]);

      // Map stores
      const sMap: Record<string, string> = {};
      if (Array.isArray(storesData)) {
        storesData.forEach((s: any) => {
          if (s._id) sMap[s._id] = s.name;
        });
      } else if (storesData?.data && Array.isArray(storesData.data)) {
        storesData.data.forEach((s: any) => {
          if (s._id) sMap[s._id] = s.name;
        });
      }
      setStoresMap(sMap);

      // Map products to stores
      const pStoreMap: Record<string, string> = {};
      const pList = Array.isArray(productsData)
        ? productsData
        : (productsData as any)?.data && Array.isArray((productsData as any).data)
          ? (productsData as any).data
          : [];
      pList.forEach((p: any) => {
        if (p._id && p.store) {
          const pStoreId = typeof p.store === "object" ? p.store._id : p.store;
          if (pStoreId) pStoreMap[p._id] = pStoreId;
        }
      });
      setProductStoreMap(pStoreMap);

      // Map reviews
      if (Array.isArray(reviewsData)) {
        setReviews(reviewsData);
      } else if (
        reviewsData &&
        typeof reviewsData === "object" &&
        Array.isArray((reviewsData as any).data)
      ) {
        setReviews((reviewsData as any).data);
      } else {
        setReviews([]);
      }
      setError(null);
    } catch (err: any) {
      console.error("Lỗi lấy danh sách đánh giá:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!(await confirm(`Bạn có chắc chắn muốn xóa đánh giá này không?`))) {
      return;
    }

    try {
      await apiAdminReview.deleteReview(id);
      showSuccessModal("Xóa đánh giá thành công!");
      fetchReviewsAndStores();
    } catch (err: any) {
      console.error("Lỗi xóa đánh giá:", err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi xóa đánh giá.");
    }
  };

  useEffect(() => {
    fetchReviewsAndStores();
  }, []);

  // Helper để render sao
  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-3 h-3 ${i < rating ? "fill-current" : "text-gray-300"}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Quản lý đánh giá</h2>
          <p className="text-xs text-gray-500">
            Xem và quản lý tất cả bình luận, đánh giá từ người dùng trên hệ thống.
          </p>
        </div>
        <button
          onClick={fetchReviewsAndStores}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium border"
        >
          🔄 Làm mới dữ liệu
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin mx-auto mb-2"></div>
          Đang kết nối hệ thống dữ liệu...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Người dùng</th>
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Cửa hàng</th>
                <th className="py-3 px-4">Đánh giá</th>
                <th className="py-3 px-4">Nội dung</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Hệ thống hiện tại chưa ghi nhận đánh giá nào.
                  </td>
                </tr>
              ) : (
                reviews
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {r.user?.fullName || r.user?.email || "Người dùng ẩn danh"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {r.product?.name || "Sản phẩm không xác định"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {(() => {
                          if (r.product?.store?.name) return r.product.store.name;
                          if (r.store?.name) return r.store.name;

                          let pStoreId =
                            typeof r.product?.store === "object"
                              ? r.product.store._id
                              : r.product?.store;

                          // Fallback to finding the storeId using the productId via our productStoreMap
                          if (!pStoreId && r.product?._id) {
                            pStoreId = productStoreMap[r.product._id];
                          }

                          if (pStoreId && storesMap[pStoreId]) return storesMap[pStoreId];

                          const rStoreId = typeof r.store === "object" ? r.store._id : r.store;
                          if (rStoreId && storesMap[rStoreId]) return storesMap[rStoreId];

                          return "Không xác định";
                        })()}
                      </td>
                      <td className="py-3.5 px-4">{renderStars(r.rating || 0)}</td>
                      <td className="py-3.5 px-4">
                        <p className="line-clamp-2 text-gray-600 max-w-xs" title={r.comment}>
                          {r.comment || (
                            <span className="italic text-gray-400">Không có bình luận</span>
                          )}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-3 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteReview(r._id)}
                          className="text-red-600 hover:text-red-700 hover:underline text-xs font-semibold"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
          {reviews.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <span className="text-sm text-gray-500">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, reviews.length)} trên tổng {reviews.length}{" "}
                đánh giá
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium border rounded-md disabled:opacity-50 hover:bg-gray-100 bg-white"
                >
                  Trước
                </button>
                <span className="text-sm font-medium px-2 text-gray-600">
                  Trang {currentPage} / {Math.ceil(reviews.length / itemsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, Math.ceil(reviews.length / itemsPerPage)),
                    )
                  }
                  disabled={currentPage === Math.ceil(reviews.length / itemsPerPage)}
                  className="px-3 py-1.5 text-sm font-medium border rounded-md disabled:opacity-50 hover:bg-gray-100 bg-white"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
