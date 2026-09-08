import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";
import { CheckCircle2, ArrowRight, ShoppingBag, ReceiptText } from "lucide-react";

type CheckoutSuccessSearch = {
  orderId?: string;
  subOrderId?: string;
};

export const Route = createFileRoute("/_site/checkout-success")({
  validateSearch: (search: Record<string, unknown>): CheckoutSuccessSearch => {
    return {
      orderId: search.orderId as string | undefined,
      subOrderId: search.subOrderId as string | undefined,
    };
  },
  component: CheckoutSuccess,
});

function CheckoutSuccess() {
  const search = Route.useSearch();
  const displayId = search.subOrderId || search.orderId;

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Giỏ hàng", to: "/cart" },
          { label: "Thanh toán", to: "/checkout" },
          { label: "Đặt hàng thành công" },
        ]}
      />
      <PageHeader title="Thanh toán đơn hàng" />

      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="max-w-xl w-full bg-card rounded-2xl shadow-[var(--shadow-card)] border border-border p-8 md:p-12 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600" />

          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-4">Đặt hàng thành công!</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Cảm ơn bạn đã mua sắm tại ShopTech. Đơn hàng của bạn đã được ghi nhận và đang chờ xử lý.
          </p>

          {displayId && (
            <div className="bg-muted/50 rounded-xl p-5 mb-8 border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">Mã đơn hàng của bạn</p>
              <p className="text-xl font-bold font-mono text-primary">{displayId}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/account/orders"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30"
            >
              <ReceiptText className="w-5 h-5" />
              Xem đơn hàng
            </Link>

            <Link
              to="/"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-secondary text-secondary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
