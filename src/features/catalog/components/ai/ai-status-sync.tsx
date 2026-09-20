"use client";

import { useEffect } from "react";
import type { AiStatus } from "@/features/catalog/api/ai-api";
import { useAiStatusStore } from "@/stores/ai-status-store";

/* Đổ trạng thái AI (layout nạp ở server) vào store để mọi nút/khối AI phía client đọc. Không render gì. */
export function AiStatusSync({ status }: { status: AiStatus }) {
  const set = useAiStatusStore((s) => s.set);
  useEffect(() => { set(status); }, [status, set]);
  return null;
}
