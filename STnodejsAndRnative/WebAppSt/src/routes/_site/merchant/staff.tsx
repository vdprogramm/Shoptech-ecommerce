import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { apiMerchant } from "../../../lib/api/api-merchant";
import StaffForm from "./-components/StaffForm";
import axios from "axios"; // Dùng để gọi fetch store hộ nếu cần

export const Route = createFileRoute("/_site/merchant/staff")({
  component: MerchantStaffPage,
});

function MerchantStaffPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [missingStoreError, setMissingStoreError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Lấy thông tin user hiện tại từ localStorage (Giả định bạn lưu khi đăng nhập thành công)
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("accessToken");

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await apiMerchant.getStaff();
      setStaffList(response.data || response);
      setMissingStoreError(null);
    } catch (error: any) {
      console.error("Lỗi tải danh sách nhân viên:", error);

      // 🔴 BẪY LỖI: Nếu BE báo lỗi chưa liên kết chi nhánh (do token thiếu storeId)
      if (error.response?.status === 400 && storedUser._id) {
        handleFixMissingStoreId();
      } else {
        setMissingStoreError("Không thể tải danh sách nhân viên do lỗi hệ thống.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ⚡ HÀM TỰ ĐỘNG SỬA LỖI CHO FE:
  const handleFixMissingStoreId = async () => {
    try {
      // 1. Gọi endpoint findByManager của BE để lấy Store ông này quản lý
      // URL thông thường sẽ map với Route @Get('manager/:managerId') của StoresController
      const resStore = await axios.get(`http://localhost:3001/stores/manager/${storedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const stores = resStore.data;
      if (stores && stores.length > 0) {
        // Tìm thấy store ông này quản lý!
        setMissingStoreError(
          `Tài khoản của bạn có cửa hàng [${stores[0].name}] trên DB nhưng Token hiện tại chưa được cập nhật. Bạn vui lòng ĐĂNG XUẤT và ĐĂNG NHẬP LẠI để đồng bộ dữ liệu nhé!`,
        );
      } else {
        setMissingStoreError(
          "Tài khoản Chủ cửa hàng này chưa được Admin gán quản lý cho bất kỳ chi nhánh nào dưới Database.",
        );
      }
    } catch (err) {
      setMissingStoreError("Tài khoản của bạn chưa được liên kết với cửa hàng nào.");
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Nhân Viên Cửa Hàng</h1>
          <p className="text-sm text-gray-500">
            Danh sách các tài khoản nhân viên thuộc chi nhánh quản lý của bạn
          </p>
        </div>

        {/* Chỉ cho bấm thêm nhân viên nếu không bị lỗi thiếu Store */}
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!!missingStoreError}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          + Thêm nhân viên mới
        </button>
      </div>

      {/* Hiển thị Banner cảnh báo lỗi nghiệp vụ dữ liệu để user biết cách xử lý */}
      {missingStoreError && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800">
          ⚠️ <strong>Thông báo:</strong> {missingStoreError}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
      ) : missingStoreError ? (
        <div className="bg-white rounded-xl p-8 border text-center text-gray-400">
          Không có dữ liệu hiển thị do lỗi liên kết chi nhánh.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm font-semibold">
                <th className="p-4">Họ và tên</th>
                <th className="p-4">Email</th>
                <th className="p-4">Chức vụ</th>
                <th className="p-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    Chưa có nhân viên nào dưới quyền chi nhánh này.
                  </td>
                </tr>
              ) : (
                staffList
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((staff) => (
                    <tr key={staff._id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium text-gray-900">{staff.fullName}</td>
                      <td className="p-4 text-gray-500">{staff.email}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                          Nhân viên cửa hàng
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${staff.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}
                        >
                          {staff.isActive ? "Đang hoạt động" : "Tạm khóa"}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>

          {Math.ceil(staffList.length / itemsPerPage) > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-gray-500">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, staffList.length)} trên tổng{" "}
                {staffList.length} nhân viên
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="text-sm font-medium px-2">
                  Trang {currentPage} / {Math.ceil(staffList.length / itemsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(Math.ceil(staffList.length / itemsPerPage), p + 1),
                    )
                  }
                  disabled={currentPage === Math.ceil(staffList.length / itemsPerPage)}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <StaffForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchStaff();
          }}
        />
      )}
    </div>
  );
}
