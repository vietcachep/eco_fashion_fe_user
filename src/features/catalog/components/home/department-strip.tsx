import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import type { CategoryResponse } from "@/features/catalog/types";
import { nhomTheoNganhHang } from "@/features/catalog/lib/departments";
import { chonIconNganhHang } from "@/features/catalog/components/shared/department-icons";

/*
 * Dải NGÀNH HÀNG trên trang chủ — đặt ngay dưới Hero, việc đầu tiên khách thấy sau banner là
 * "sàn có những gì" (mẫu chuẩn của sàn đa ngành hàng: Shopee/Lazada đặt dải icon ngành hàng rất sớm,
 * KHÁC hẳn shop thời trang đơn lẻ chỉ có 1 ảnh hero rồi vào thẳng sản phẩm). PLAN-0016 — phản hồi người
 * dùng: trang chủ "nhìn như 1 shop thời trang". Icon dùng chung với mega menu "Danh mục"
 * (`components/shared/department-icons.tsx`, `components/layout/nav.tsx`).
 */
export function DepartmentStrip({ danhMuc }: { danhMuc: CategoryResponse[] }) {
  const nganh = nhomTheoNganhHang(danhMuc);
  if (nganh.length === 0) return null;

  return (
    <div className="flat-spacing-4">
      <div className="container">
        <div className="departments-grid">
          {nganh.map((n) => {
            const Icon = chonIconNganhHang(n.heading);
            const dauTien = n.items[0];
            if (!dauTien) return null;
            return (
              /* Ngành có con → vào thẳng ngành gốc (trang liệt kê các nhóm con); nhóm "Thời trang" không có ngành gốc nên vào mục đầu. */
              <Link key={n.heading} href={ROUTES.category(n.slug ?? dauTien.slug)} className="department-tile">
                <span className="department-tile-icon"><Icon width={28} height={28} /></span>
                <span className="department-tile-name">{n.heading}</span>
                <span className="department-tile-sub">{n.items.map((c) => c.name).join(" · ")}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
