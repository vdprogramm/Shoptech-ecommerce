import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import heroImg from "@/assets/hero-banner.jpg";
import phoneImg from "@/assets/product-phone.jpg";
import laptopImg from "@/assets/product-laptop.jpg";
import { bannerService, IBanner } from "@/lib/api/api-banner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export function Hero() {
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await bannerService.getActiveBanners("TopSlider");
        setBanners(data || []);
      } catch (error) {
        console.error("Lỗi lấy banner:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBanners();
  }, []);

  return (
    <section className="container mx-auto px-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-3 overflow-hidden rounded-xl shadow-[var(--shadow-card)] block relative group">
          {isLoading || banners.length === 0 ? (
            <Link to="/promotions" className="block w-full h-full">
              <img
                src={heroImg}
                alt="Siêu khuyến mãi thiết bị điện tử"
                className="w-full h-[280px] md:h-[380px] object-cover transition hover:scale-[1.01]"
                width={1600}
                height={640}
              />
            </Link>
          ) : (
            <Carousel
              plugins={[
                Autoplay({
                  delay: 4000,
                }),
              ]}
              opts={{
                loop: true,
              }}
              className="w-full h-full"
            >
              <CarouselContent className="h-full">
                {banners.map((banner) => (
                  <CarouselItem key={banner._id} className="h-full">
                    <Link to={banner.targetLink || "/promotions"} className="block w-full h-full">
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-[280px] md:h-[380px] object-cover"
                      />
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {banners.length > 1 && (
                <>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CarouselPrevious className="relative left-0 translate-y-0 hover:bg-background/90 bg-background/50 border-none text-foreground" />
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CarouselNext className="relative right-0 translate-y-0 hover:bg-background/90 bg-background/50 border-none text-foreground" />
                  </div>
                </>
              )}
            </Carousel>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
          <Link
            to="/category/$slug"
            params={{ slug: "dien-thoai" }}
            className="group rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden flex flex-col justify-center h-full min-h-[160px]"
          >
            <div className="relative z-10 max-w-[55%]">
              <div className="text-xs font-medium opacity-90 mb-1 uppercase tracking-wider">Trả góp 0%</div>
              <div className="text-xl font-bold leading-tight mb-3">iPhone 15 Pro Max</div>
              <div className="text-xs font-semibold bg-white/20 inline-block px-2.5 py-1 rounded-full backdrop-blur-sm">Giảm đến 5 triệu</div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-[55%] h-[110%] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
              <img src={phoneImg} alt="iPhone 15 Pro Max" className="w-full h-full object-contain drop-shadow-2xl object-bottom" />
            </div>
          </Link>
          <Link
            to="/flash-sale"
            className="group rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden flex flex-col justify-center h-full min-h-[160px]"
          >
            <div className="relative z-10 max-w-[65%]">
              <div className="text-[10px] font-bold opacity-90 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                 <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> FLASH SALE
              </div>
              <div className="text-xl font-bold leading-tight mb-3 text-white">MacBook Air M3</div>
              <div className="text-xs font-semibold bg-black/20 inline-block px-2.5 py-1 rounded-full backdrop-blur-sm text-white">Quà tặng 2 triệu</div>
            </div>
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-[60%] h-[90%] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              <img src={laptopImg} alt="MacBook Air M3" className="w-full h-full object-contain drop-shadow-2xl object-center" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
