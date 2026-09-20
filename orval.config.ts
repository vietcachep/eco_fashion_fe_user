import { defineConfig } from "orval";

/*
 * Orval codegen: OpenAPI spec (openapi/openapi.json, tải từ backend bằng
 * `npm run api:spec`) -> model TypeScript + hook TanStack Query trong
 * src/lib/api/generated (KHÔNG sửa tay). Mọi lời gọi sinh ra đi qua axios
 * instance chung nhờ mutator.ts, nên interceptor JWT và proxy /api vẫn chạy.
 *
 * Backend chưa chốt (PLAN-0002): URL spec đặt qua biến môi trường
 * API_SPEC_URL, mặc định FastAPI local `http://localhost:8000/openapi.json`.
 */
export default defineConfig({
  fashion: {
    input: {
      target: "./openapi/openapi.json",
    },
    output: {
      mode: "tags-split",
      target: "./src/lib/api/generated",
      schemas: "./src/lib/api/generated/model",
      client: "react-query",
      httpClient: "axios",
      clean: true,
      override: {
        mutator: {
          path: "./src/lib/api/mutator.ts",
          name: "customInstance",
        },
        query: {
          useQuery: true,
          signal: true,
        },
      },
    },
  },
});
