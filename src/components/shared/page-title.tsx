import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export interface Crumb { label: string; href?: string }

/*
 * Dải tiêu đề trang — `tf-page-title` của Vineta (nền ảnh section/page-title.jpg,
 * tiêu đề giữa, breadcrumb chấm tròn, mô tả). Dùng cho danh sách, giỏ, đặt hàng,
 * yêu thích, so sánh và các trang thông tin.
 */
export function PageTitle({ title, desc, crumbs = [] }: { title: string; desc?: string; crumbs?: Crumb[] }) {
  return (
    <section className="tf-page-title">
      <div className="container">
        <div className="box-title text-center">
          <h4 className="title">{title}</h4>
          <div className="breadcrumb-list">
            <Link className="breadcrumb-item" href={ROUTES.home}>Trang chủ</Link>
            {crumbs.map((c) => (
              <span key={c.label} className="d-contents">
                <div className="breadcrumb-item dot"><span /></div>
                {c.href ? <Link className="breadcrumb-item" href={c.href}>{c.label}</Link> : <div className="breadcrumb-item current">{c.label}</div>}
              </span>
            ))}
            {crumbs.length === 0 && (<><div className="breadcrumb-item dot"><span /></div><div className="breadcrumb-item current">{title}</div></>)}
          </div>
          {desc && <p className="desc text-md text-main">{desc}</p>}
        </div>
      </div>
    </section>
  );
}
