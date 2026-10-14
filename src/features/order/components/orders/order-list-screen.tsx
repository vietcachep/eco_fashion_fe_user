"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MockBadge } from "@/components/shared/mock-badge";
import { PagedAccountList } from "@/features/order/components/account-list/paged-account-list";
import { ChildOrderCard, OrderGroupCard } from "@/features/order/components/orders/order-list-cards";
import { TAB_DON } from "@/features/order/hooks/order-status";
import { useOrderGroupsPage, useOrdersPage } from "@/features/order/hooks/use-orders";
import type { OrderStatus } from "@/features/order/types";

/*
 * "Đơn hàng của tôi". Tab "Tất cả" liệt kê theo ĐƠN CHA (một lần đặt hàng = một thẻ, bên trong từng đơn con theo shop); các tab
 * trạng thái liệt kê ĐƠN CON khớp trạng thái đó, vì trạng thái là của từng đơn con (đơn cha không có trạng thái riêng) và BE lọc
 * theo trạng thái ở `GET /orders?status=`. Cả tab lẫn trang nằm trên URL (`?status=&page=`) để chia sẻ được link và Back đúng ý;
 * phân trang ở server (10/trang) — không tải hết rồi lọc ở client.
 */
const SO_DON_MOI_TRANG = 10;

export function OrderListScreen({ status, page }: { status?: string; page: number }) {
  const tab = TAB_DON.find((t) => t.key === status) ?? TAB_DON[0];
  const hrefFor = (p: number) => {
    const q = new URLSearchParams();
    if (tab.key !== "all") q.set("status", tab.key);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `${ROUTES.accountOrders}?${s}` : ROUTES.accountOrders;
  };

  return (
    <div className="my-acount-content account-orders">
      <h6 className="title-account d-flex align-items-center gap-8">Đơn hàng của tôi <MockBadge /></h6>

      <div className="acc-tabs" role="tablist">
        {TAB_DON.map((t) => (
          <Link key={t.key} href={t.key === "all" ? ROUTES.accountOrders : `${ROUTES.accountOrders}?status=${t.key}`} role="tab" aria-selected={t.key === tab.key} className={cn("acc-tab", t.key === tab.key && "active")}>
            {t.label}
          </Link>
        ))}
      </div>

      {/* `key` theo tab: đổi tab là tải danh sách mới hẳn (skeleton), không trộn dữ liệu tab cũ vào bằng keepPreviousData */}
      {tab.key === "all"
        ? <GroupList key="all" page={page} hrefFor={hrefFor} />
        : <ChildList key={tab.key} status={tab.key} label={tab.label} page={page} hrefFor={hrefFor} />}
    </div>
  );
}

function Rong({ tieuDe, moTa }: { tieuDe: string; moTa: string }) {
  return (
    <div className="acc-empty">
      <p className="text-md fw-medium">{tieuDe}</p>
      <p className="text-sm text-main mt_4">{moTa}</p>
      <Link href={ROUTES.products} className="tf-btn animate-btn btn-small mt_16">Bắt đầu mua sắm</Link>
    </div>
  );
}

function GroupList({ page, hrefFor }: { page: number; hrefFor: (p: number) => string }) {
  const query = useOrderGroupsPage({ page, size: SO_DON_MOI_TRANG });
  return (
    <PagedAccountList
      query={query} page={page} hrefFor={hrefFor} keyOf={(g) => g.code} render={(g) => <OrderGroupCard group={g} />}
      loiMacDinh="Không tải được danh sách đơn hàng. Thử lại sau nhé."
      empty={<Rong tieuDe="Bạn chưa có đơn hàng nào" moTa="Đơn bạn đặt sẽ hiện ở đây." />}
    />
  );
}

function ChildList({ status, label, page, hrefFor }: { status: OrderStatus; label: string; page: number; hrefFor: (p: number) => string }) {
  const query = useOrdersPage({ page, size: SO_DON_MOI_TRANG, status });
  return (
    <PagedAccountList
      query={query} page={page} hrefFor={hrefFor} keyOf={(o) => o.code} render={(o) => <ChildOrderCard order={o} />}
      loiMacDinh="Không tải được danh sách đơn hàng. Thử lại sau nhé."
      empty={<Rong tieuDe={`Chưa có đơn nào ở mục "${label}"`} moTa="Trạng thái được tính theo từng đơn của mỗi gian hàng." />}
    />
  );
}
