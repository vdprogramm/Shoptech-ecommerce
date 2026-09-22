import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

export function GlobalSuccessModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleShow = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      setMessage(customEvent.detail.message);
      setIsOpen(true);
    };
    window.addEventListener("show-success-modal", handleShow);
    return () => window.removeEventListener("show-success-modal", handleShow);
  }, []);

  // Tự động đóng sau 2.5 giây và hỗ trợ phím Esc/Enter
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => setIsOpen(false), 2500);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-card w-full max-w-sm md:max-w-md rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8 flex flex-col items-center text-center relative zoom-in-95 animate-in duration-300 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút Đóng */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Thành Công */}
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-green-400/20 animate-ping rounded-full" />
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 relative z-10" />
        </div>

        {/* Tiêu đề & Lời nhắn */}
        <h2 className="text-2xl font-black text-foreground mb-3 tracking-tight">Thành công!</h2>
        <p className="text-muted-foreground mb-8 text-sm md:text-base leading-relaxed px-2">
          {message}
        </p>

        {/* Nút Xác nhận */}
        <button
          onClick={() => setIsOpen(false)}
          className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-green-600/30 flex items-center justify-center gap-2"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

export const showSuccessModal = (message: string) => {
  window.dispatchEvent(new CustomEvent("show-success-modal", { detail: { message } }));
};
