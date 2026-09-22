import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function getImageUrl(path?: string): string {
  if (!path) return "/placeholder-product.png";
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  return `${backendUrl}/${cleanPath}`;
}
