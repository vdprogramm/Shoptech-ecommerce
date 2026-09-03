import React from "react";

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
}: TablePaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-4 bg-white/50">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
        {Math.min(currentPage * itemsPerPage, totalItems)} trên tổng {totalItems} bản ghi
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50 hover:bg-muted transition-colors font-medium whitespace-nowrap bg-white"
        >
          Trang trước
        </button>
        <span className="text-sm font-medium px-2 whitespace-nowrap">
          Trang {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50 hover:bg-muted transition-colors font-medium whitespace-nowrap bg-white"
        >
          Trang sau
        </button>
      </div>
    </div>
  );
}
