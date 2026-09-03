import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { AiChat } from "@/components/site/AiChat";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col premium-bg">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AiChat />
    </div>
  );
}
