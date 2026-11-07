"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { liveClaimsApi } from "../api/live-claims-api";
export function useLiveClaims(page: number) {
  const user = useAuthStore((s) => s.user), ready = useAuthStore((s) => s.bootstrapped);
  return useQuery({ queryKey: ["promotion", "my-live-claims", user?.id, page], queryFn: () => liveClaimsApi.list(page), enabled: ready && Boolean(user), staleTime: 10_000, retry: 1 });
}
export const useVoucherRecovery = () => useMutation({ mutationFn: liveClaimsApi.recovery });
