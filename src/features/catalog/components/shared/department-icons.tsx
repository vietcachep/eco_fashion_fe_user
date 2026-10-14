/*
 * Icon ngành hàng dùng chung — mega menu "Danh mục" (`components/layout/nav.tsx`) và dải ngành hàng trang
 * chủ (`components/home/department-strip.tsx`). Tự vẽ (không phụ thuộc ảnh — ngành mới seed chưa có ảnh
 * cover), khớp icon theo TÊN ngành, có icon dự phòng cho ngành thêm sau chưa kịp vẽ icon riêng.
 */
export function chonIconNganhHang(heading: string) {
  const t = heading.toLowerCase();
  if (t.includes("thời trang")) return IconThoiTrang;
  if (t.includes("điện thoại")) return IconDienThoai;
  if (t.includes("nhà cửa")) return IconNhaCua;
  if (t.includes("sắc đẹp") || t.includes("sức khoẻ") || t.includes("sức khỏe")) return IconSacDep;
  return IconNganhHangKhac;
}

const IconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function IconThoiTrang(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...IconProps} {...props} aria-hidden="true">
      <path d="M9 4l3 2 3-2 4 3-2 3-2-1v10H8V9l-2 1-2-3 4-3z" />
    </svg>
  );
}

export function IconDienThoai(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...IconProps} {...props} aria-hidden="true">
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 18.5h2" />
    </svg>
  );
}

export function IconNhaCua(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...IconProps} {...props} aria-hidden="true">
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v10h12V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

export function IconSacDep(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...IconProps} {...props} aria-hidden="true">
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
    </svg>
  );
}

export function IconNganhHangKhac(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...IconProps} {...props} aria-hidden="true">
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
