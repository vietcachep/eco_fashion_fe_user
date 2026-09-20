"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { makeQueryClient } from "@/lib/query-client";
import { StoreHydration } from "@/providers/store-hydration";

/*
 * Provider cấp app — bọc MỘT lần ở root layout.
 * QueryClient tạo trong useState để mỗi phiên trình duyệt có một client riêng
 * (tạo ở module scope là dùng chung giữa các request SSR — rò cache giữa người dùng).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={client}>
      <StoreHydration />
      {children}
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
