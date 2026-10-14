"use client";

import { useEffect, useState } from "react";

/* Giá trị "đã ngừng đổi" sau `ms` mili giây — ô tìm kiếm gợi ý dùng để không bắn một request cho MỖI phím gõ. */
export function useDebouncedValue<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
