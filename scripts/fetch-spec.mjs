/* Tải OpenAPI spec của backend về openapi/openapi.json (chạy được trên Windows — `${VAR:-default}` của sh không có trong cmd). */
import { mkdir, writeFile } from "node:fs/promises";

const url = process.env.API_SPEC_URL || "http://localhost:4000/docs/openapi.json";
const res = await fetch(url, { headers: { "Cache-Control": "no-cache" } });
if (!res.ok) { console.error(`Không tải được spec ${url}: HTTP ${res.status}`); process.exit(1); }
await mkdir("openapi", { recursive: true });
await writeFile("openapi/openapi.json", await res.text(), "utf8");
console.log(`Đã lưu spec từ ${url}`);
