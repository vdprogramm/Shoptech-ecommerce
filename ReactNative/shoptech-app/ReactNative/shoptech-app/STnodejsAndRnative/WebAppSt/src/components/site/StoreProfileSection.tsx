import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";
import type { IStore } from "@/lib/api/api-store";

export function StoreProfileSection({
  store,
  productCount = 0,
}: {
  store: IStore | null;
  productCount?: number;
}) {
  if (!store) return null;

  return (
    <div className="bg-secondary/30 rounded-xl border p-4 flex flex-row items-center justify-between my-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center overflow-hidden shrink-0">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
          ) : (
            <Store className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div>
          <h3 className="font-bold text-[15px] text-foreground">{store.name}</h3>
          <div className="flex items-center gap-1.5 text-xs mt-1">
            <span
              className={`h-2 w-2 rounded-full ${store.isActive !== false ? "bg-green-500" : "bg-gray-400"}`}
            ></span>
            <span
              className={`${store.isActive !== false ? "text-green-500" : "text-gray-500"} font-medium`}
            >
              {store.isActive !== false ? "Đang hoạt động" : "Tạm nghỉ"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              Sản phẩm: <strong className="text-foreground">{productCount}</strong>
            </span>
          </div>
        </div>
      </div>

      <Link
        to={`/store/${store._id}` as any}
        className="px-4 py-1.5 rounded-lg border border-red-500 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors shrink-0"
      >
        Xem Shop
      </Link>
    </div>
  );
}
