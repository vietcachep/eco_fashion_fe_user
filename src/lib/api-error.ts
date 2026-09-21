import { isAxiosError } from "axios";
import type { ApiResponse } from "@/types/common";

/*
 * Đọc lỗi API ở MỘT chỗ — mọi màn nói cùng một giọng.
 * Backend trả envelope `ApiResponse`: lỗi nằm ở `data.error.{code,message}`.
 */

export function apiStatus(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined;
}

function apiEnvelope(err: unknown): ApiResponse<unknown> | undefined {
  if (!isAxiosError(err)) return undefined;
  return err.response?.data as ApiResponse<unknown> | undefined;
}

export function apiMessage(err: unknown): string | undefined {
  const env = apiEnvelope(err);
  if (env) {
    const envObj = env as unknown as Record<string, unknown>;
    if (typeof envObj.message === "string" && envObj.message && envObj.message !== "Failed") {
      return envObj.message;
    }
    const errObj = envObj.error as Record<string, unknown> | undefined;
    if (typeof errObj?.message === "string" && errObj.message) {
      return errObj.message;
    }
  }
  if (isAxiosError(err)) {
    const d = err.response?.data as Record<string, unknown> | undefined;
    if (typeof d?.message === "string" && d.message) return d.message;
    if (Array.isArray(d?.message) && d.message.length > 0) return String(d.message[0]);
  }
  return undefined;
}

export function apiErrorCode(err: unknown): string | undefined {
  return apiEnvelope(err)?.error?.code || undefined;
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  return apiMessage(err) ?? fallback;
}
