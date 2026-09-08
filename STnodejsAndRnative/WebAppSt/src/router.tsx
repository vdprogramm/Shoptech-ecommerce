// 🛡️ BƯỚC 1: ĐẶT LÊN TRÊN CÙNG (TRƯỚC TẤT CẢ LỆNH IMPORT)
// Giả lập localStorage trên Server để chặn đứng lỗi crash 500 khi nạp Route Tree
if (typeof window === "undefined") {
  const serverStorage: Storage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };

  Object.defineProperty(globalThis, "localStorage", {
    value: serverStorage,
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, "sessionStorage", {
    value: serverStorage,
    configurable: true,
    writable: true,
  });
}

import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen"; // <- File này nạp flash-sales, giờ không sợ lỗi nữa

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
