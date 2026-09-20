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
  return apiEnvelope(err)?.error?.message || undefined;
}

export function apiErrorCode(err: unknown): string | undefined {
  return apiEnvelope(err)?.error?.code || undefined;
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  return apiMessage(err) ?? fallback;
}
