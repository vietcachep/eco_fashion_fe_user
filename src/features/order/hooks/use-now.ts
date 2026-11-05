"use client";

import { useSyncExternalStore } from "react";

/*
 * "Bây giờ" theo phút, cho đồng hồ đếm ngược hạn đổi trả. Dùng `useSyncExternalStore` (không `setState` trong effect) để đồng hồ chạy được
 * mà vẫn qua luật lint của React Compiler. Giá trị làm tròn xuống phút nên giữa hai lần kiểm tra trong cùng một phút không render lại.
 * Phía server trả 0: các màn dùng hook này chỉ vẽ SAU khi dữ liệu query về (client), không nằm trong HTML dựng sẵn nên không lệch hydration.
 */
const subscribe = (onChange: () => void) => {
  const t = setInterval(onChange, 20_000);
  return () => clearInterval(t);
};
const getSnapshot = () => Math.floor(Date.now() / 60_000) * 60_000;
const getServerSnapshot = () => 0;

export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
