import { OrderThumb } from "@/features/order/components/orders/order-thumb";
import type { ReturnItemLine } from "@/features/order/types";
import { nhanBienThe } from "@/stores/cart-store";

/* Các dòng hàng của một yêu cầu đổi trả (ảnh + tên + biến thể + số lượng) — dùng ở danh sách và chi tiết. */
export function ReturnLines({ items }: { items: ReturnItemLine[] }) {
  return (
    <ul className="return-items">
      {items.map((i) => {
        const bienThe = nhanBienThe(i.color, i.size);
        return (
          <li key={i.order_item_id} className="d-flex align-items-center gap-12">
            <OrderThumb src={i.image_url} alt={i.name} width={40} height={53} />
            <span className="text-sm min-w-0">{i.name} <span className="text-xs text-main">· {bienThe && `${bienThe} · `}×{i.quantity}</span></span>
          </li>
        );
      })}
    </ul>
  );
}
