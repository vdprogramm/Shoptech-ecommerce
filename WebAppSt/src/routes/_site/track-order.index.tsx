import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_site/track-order/")({
  component: TrackOrderIndexPage,
});

function TrackOrderIndexPage() {
  const [orderId, setOrderId] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      navigate({ to: "/track-order/$orderId", params: { orderId: orderId.trim() } });
    }
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Tra cứu đơn hàng" }]} />
      <PageHeader
        title="Tra cứu đơn hàng"
        subtitle="Nhập mã đơn hàng của bạn để kiểm tra tình trạng"
      />

      <div className="container mx-auto px-4 pb-20 max-w-xl mt-8">
        <div className="rounded-xl bg-card p-8 shadow-sm border">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="space-y-2">
              <label htmlFor="orderId" className="text-sm font-medium">
                Mã đơn hàng
              </label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Ví dụ: ORD123456"
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full h-11">
              <Search className="mr-2 h-4 w-4" />
              Tra cứu
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
