import { clsx, type ClassValue } from "clsx";

/* Ghép class có điều kiện. Không còn tailwind-merge (đã bỏ Tailwind — PLAN-0005). */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
