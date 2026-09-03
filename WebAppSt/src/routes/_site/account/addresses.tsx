import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/account/addresses")({
  component: () => (
    <>
      <h2 className="text-xl font-bold mb-4">Sổ địa chỉ</h2>
      <div className="space-y-3">
        <div className="rounded-lg border p-3 text-sm">
          <div className="font-semibold">Nguyễn Văn A - 0901234567</div>
          <div className="text-muted-foreground">123 Đường ABC, Phường X, Quận Y, TP. HCM</div>
          <span className="mt-1 inline-block text-xs text-primary">Mặc định</span>
        </div>
        <button className="rounded-xl border-2 border-dashed border-primary px-6 py-3 font-bold text-primary hover:bg-primary/5">
          + Thêm địa chỉ mới
        </button>
      </div>
    </>
  ),
});
