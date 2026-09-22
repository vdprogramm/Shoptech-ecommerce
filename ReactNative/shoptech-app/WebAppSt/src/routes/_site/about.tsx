import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Breadcrumb } from "@/components/site/PageHeader";

export const Route = createFileRoute("/_site/about")({
  component: () => (
    <>
      <Breadcrumb items={[{ label: "Giới thiệu" }]} />
      <PageHeader title="Về EShop" />
      <div className="container mx-auto px-4 pb-10 max-w-3xl prose prose-sm text-muted-foreground space-y-4">
        <p>
          EShop là hệ thống thương mại điện tử chuyên cung cấp các thiết bị điện tử chính hãng: điện
          thoại, laptop, tablet, phụ kiện, thiết bị thông minh và đồ công nghệ tiêu dùng.
        </p>
        <p>
          Chúng tôi tập trung mang đến trải nghiệm mua sắm trực tuyến hiện đại, tiện lợi với sự hỗ
          trợ của trí tuệ nhân tạo 24/7 — giúp khách hàng tìm đúng sản phẩm phù hợp với nhu cầu và
          ngân sách.
        </p>
      </div>
    </>
  ),
});
