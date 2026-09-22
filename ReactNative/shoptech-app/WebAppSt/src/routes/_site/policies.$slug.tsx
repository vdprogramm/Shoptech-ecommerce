import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";

const POLICIES: Record<string, { title: string; body: string }> = {
  warranty: {
    title: "Chính sách bảo hành",
    body: "Tất cả sản phẩm chính hãng được bảo hành theo tiêu chuẩn nhà sản xuất từ 12-24 tháng.",
  },
  return: {
    title: "Chính sách đổi trả",
    body: "Đổi trả miễn phí trong 30 ngày với sản phẩm còn nguyên vẹn.",
  },
  privacy: {
    title: "Chính sách bảo mật",
    body: "EShop cam kết bảo mật thông tin cá nhân của khách hàng.",
  },
  payment: {
    title: "Phương thức thanh toán",
    body: "Hỗ trợ COD, chuyển khoản, MoMo, VNPAY, thẻ tín dụng quốc tế.",
  },
  shipping: {
    title: "Chính sách vận chuyển",
    body: "Miễn phí vận chuyển cho đơn từ 300.000đ. Giao hàng toàn quốc 1-3 ngày.",
  },
  installment: {
    title: "Trả góp 0%",
    body: "Trả góp qua thẻ tín dụng hoặc công ty tài chính, lãi suất 0%.",
  },
};

export const Route = createFileRoute("/_site/policies/$slug")({
  component: PolicyPage,
});

function PolicyPage() {
  const { slug } = Route.useParams();
  const p = POLICIES[slug] ?? { title: "Chính sách", body: "Nội dung đang cập nhật." };
  return (
    <>
      <Breadcrumb items={[{ label: "Chính sách" }, { label: p.title }]} />
      <PageHeader title={p.title} />
      <div className="container mx-auto px-4 pb-10 max-w-3xl text-muted-foreground">{p.body}</div>
    </>
  );
}
