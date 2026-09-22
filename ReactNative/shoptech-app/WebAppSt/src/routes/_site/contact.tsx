import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";

export const Route = createFileRoute("/_site/contact")({
  component: () => (
    <>
      <Breadcrumb items={[{ label: "Liên hệ" }]} />
      <PageHeader title="Liên hệ" subtitle="Hotline 1800.6601 - support@eshop.vn" />
      <div className="container mx-auto px-4 pb-10 max-w-xl rounded-xl bg-card p-6 shadow-[var(--shadow-card)] space-y-3">
        <input className="w-full rounded-lg border px-3 py-2" placeholder="Họ tên" />
        <input className="w-full rounded-lg border px-3 py-2" placeholder="Email" />
        <textarea className="w-full rounded-lg border px-3 py-2 min-h-32" placeholder="Nội dung" />
        <button className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground hover:bg-primary/90">
          Gửi liên hệ
        </button>
      </div>
    </>
  ),
});
