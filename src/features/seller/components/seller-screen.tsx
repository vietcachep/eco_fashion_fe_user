"use client";

import { useState } from "react";
import { useCategories } from "@/features/catalog/hooks/use-categories";
import { useStoreHydrated } from "@/lib/hooks/use-store-hydrated";
import { RegistrationForm } from "@/features/seller/components/registration-form";
import { RegistrationStatusCard } from "@/features/seller/components/registration-status-card";
import { SellerSkeleton } from "@/features/seller/components/seller-skeleton";
import { SellerLoadError, SellerLoginPrompt } from "@/features/seller/components/seller-notices";
import { useMyShopRegistration } from "@/features/seller/hooks/use-shop-registration";
import { nhomNganhHangDeChon } from "@/features/seller/lib/category-options";
import type { ShopRegistrationResponse } from "@/features/seller/types";
import { chonPhienSanSang, useAuthStore } from "@/stores/auth-store";

/*
 * Khung đăng ký của `/sell` — đảo client DUY NHẤT của trang. Rẽ nhánh theo phiên + hồ sơ của tôi:
 *   chưa khôi phục phiên      → skeleton (chưa kết luận "chưa đăng nhập": reload sẽ nháy mời đăng nhập oan)
 *   chưa đăng nhập            → mời đăng nhập, xong quay lại /sell
 *   đang tải hồ sơ            → skeleton            · tải hồ sơ lỗi → thẻ lỗi + thử lại
 *   chưa có hồ sơ             → form
 *   có hồ sơ                  → thẻ trạng thái (chờ duyệt / đã duyệt / từ chối / khoá); từ chối + bấm "Nộp lại" → form điền sẵn
 * "Đang nộp lại" nhớ theo ID hồ sơ bị từ chối chứ không phải cờ bật/tắt: hồ sơ mới (id khác) tự quay về thẻ trạng thái, không
 * cần effect/reset nào.
 */
export function SellerScreen() {
  const hydrated = useStoreHydrated(useAuthStore);
  const sanSang = useAuthStore(chonPhienSanSang);
  const user = useAuthStore((s) => s.user);
  const hoSo = useMyShopRegistration();
  const [nopLaiTu, setNopLaiTu] = useState<string | null>(null);

  if (!hydrated || !sanSang) return <SellerSkeleton />;
  if (!user) return <SellerLoginPrompt />;
  if (hoSo.data === undefined) {
    return hoSo.isError
      ? <SellerLoadError what="trạng thái hồ sơ đăng ký" onRetry={() => void hoSo.refetch()} retrying={hoSo.isFetching} />
      : <SellerSkeleton />;
  }

  const h = hoSo.data;
  if (h && !(h.canReapply && nopLaiTu === h.id)) {
    return (
      <RegistrationStatusCard
        hoSo={h} email={user.email} dangTaiLai={hoSo.isFetching}
        onTaiLai={() => void hoSo.refetch()} onNopLai={() => setNopLaiTu(h.id)}
      />
    );
  }
  return <FormKemNganhHang truocDo={h} onHuy={h ? () => setNopLaiTu(null) : undefined} />;
}

/*
 * Form chỉ dựng SAU khi có danh sách ngành hàng (danh mục công khai của storefront, cache 10 phút): <select> của RHF là ô
 * không điều khiển — giá trị mặc định chỉ gắn được khi các <option> đã có mặt lúc mount. Chưa có dữ liệu mà lỗi → thử lại
 * tại chỗ. ĐÃ có dữ liệu thì dùng dữ liệu cũ dù lần làm mới nền (vd sau CATEGORY_INVALID) lỗi: gỡ form lúc này là mất sạch
 * những gì người dùng đang nhập — nên rẽ nhánh theo `data === undefined`, không theo `isPending`/`isError`.
 */
function FormKemNganhHang({ truocDo, onHuy }: { truocDo: ShopRegistrationResponse | null; onHuy?: () => void }) {
  const nganh = useCategories();
  if (nganh.data === undefined) {
    return nganh.isError
      ? <SellerLoadError what="danh sách ngành hàng" onRetry={() => void nganh.refetch()} retrying={nganh.isFetching} />
      : <SellerSkeleton />;
  }
  return <RegistrationForm nhom={nhomNganhHangDeChon(nganh.data)} truocDo={truocDo} onHuy={onHuy} lamMoiNganh={() => void nganh.refetch()} />;
}
