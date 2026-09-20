import type { AxiosRequestConfig } from "axios";
import { api } from "@/lib/api";

/*
 * Orval mutator: every generated hook calls the backend through this
 * function, i.e. through the single shared axios instance (lib/api.ts) —
 * JWT request interceptor, 401 handling and the /api proxy all apply
 * to generated code automatically.
 */
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return api
    .request<T>({ ...config, ...options })
    .then((response) => response.data);
};

export default customInstance;
