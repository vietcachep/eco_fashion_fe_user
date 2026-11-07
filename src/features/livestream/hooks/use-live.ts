"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { liveApi } from "../api/live-api";
import { getCategories } from "@/features/catalog";
import { useAuthStore } from "@/stores/auth-store";

export const liveKeys = { session: (id: string) => ["live", "session", id] as const, products: (id: string) => ["live", "products", id] as const, messages: (id: string) => ["live", "messages", id] as const };
export const useLiveCategories = () => useQuery({ queryKey: ["categories"], queryFn: getCategories, staleTime: 10 * 60_000 });
export const useLiveList = (page: number, q: string, state: string, categorySlug = "") => useQuery({ queryKey: ["live", "list", page, q, state, categorySlug], queryFn: () => liveApi.list({ page, q, state: state || undefined, categorySlug: categorySlug || undefined }), staleTime: 15_000, retry: 1 });
export function useLiveSession(id: string) { const userId = useAuthStore((s) => s.user?.id); return useQuery({ queryKey: [...liveKeys.session(id), userId ?? "guest"], queryFn: () => liveApi.session(id), staleTime: 10_000, enabled: Boolean(id), refetchInterval: (query) => ["starting", "scheduled"].includes(query.state.data?.state ?? "") ? 10000 : false, retry: 1 }); }
export const useLiveProducts = (id: string, page: number, q: string) => useQuery({ queryKey: [...liveKeys.products(id), page, q], queryFn: () => liveApi.products(id, page, q), staleTime: 15_000, retry: 1 });
export const useLiveMessages = (id: string) => useQuery({ queryKey: liveKeys.messages(id), queryFn: () => liveApi.messages(id), staleTime: 30_000, retry: 1 });
export function useLiveCampaigns(id: string) { const userId = useAuthStore((s) => s.user?.id); return useQuery({ queryKey: ["live", "campaigns", id, userId ?? "guest"], queryFn: () => liveApi.campaigns(id), staleTime: 15_000, retry: 1 }); }
export function useLiveActions(id: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: liveKeys.session(id) });
  return {
    follow: useMutation({ mutationFn: (following: boolean) => liveApi.follow(id, following), onSuccess: refresh }),
    report: useMutation({ mutationFn: (body: { reason: string; description?: string }) => liveApi.report(id, body.reason, body.description) }),
    send: useMutation({ mutationFn: (body: { body: string; clientMessageId: string; replyToId?: string }) => liveApi.send(id, body), onSuccess: () => qc.invalidateQueries({ queryKey: liveKeys.messages(id) }) }),
    claim: useMutation({ mutationFn: (body: { campaignId: string; admissionId: string }) => liveApi.claim(id, body.campaignId), onSuccess: () => qc.invalidateQueries({ queryKey: ["live", "campaigns", id] }) }),
    like: useMutation({ mutationFn: (admissionId: string) => liveApi.like(id, admissionId) }),
  };
}
