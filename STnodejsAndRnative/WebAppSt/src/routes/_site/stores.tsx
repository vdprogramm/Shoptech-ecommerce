import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";
import { MapPin, Phone } from "lucide-react";

const stores = [
  { name: "EShop Hà Nội - Cầu Giấy", addr: "123 Xuân Thủy, Cầu Giấy", phone: "024 1234 5678" },
  { name: "EShop TP.HCM - Quận 1", addr: "45 Nguyễn Huệ, Quận 1", phone: "028 1234 5678" },
  { name: "EShop Đà Nẵng", addr: "88 Hùng Vương, Hải Châu", phone: "0236 123 456" },
  { name: "EShop Hải Phòng", addr: "12 Lạch Tray, Ngô Quyền", phone: "0225 123 456" },
];

export const Route = createFileRoute("/_site/stores")({
  component: () => (
    <>
      <Breadcrumb items={[{ label: "Hệ thống cửa hàng" }]} />
      <PageHeader title="Hệ thống cửa hàng" subtitle={`${stores.length}+ chi nhánh toàn quốc`} />
      <div className="container mx-auto px-4 pb-10 grid md:grid-cols-2 gap-4">
        {stores.map((s) => (
          <div key={s.name} className="rounded-xl bg-card p-4 shadow-[var(--shadow-card)]">
            <h3 className="font-bold">{s.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4" /> {s.addr}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Phone className="h-4 w-4" /> {s.phone}
            </p>
          </div>
        ))}
      </div>
    </>
  ),
});
