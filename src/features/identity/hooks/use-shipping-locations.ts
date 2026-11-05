"use client";

import { useQuery } from "@tanstack/react-query";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { bocData } from "@/lib/api/envelope";
import { shippingControllerDistricts, shippingControllerProvinces, shippingControllerWards } from "@/lib/api/generated/shipping/shipping";
import type { ShippingLocationResponse } from "@/lib/api/generated/model";
import type { ApiResponse } from "@/types/common";

export function useShippingLocations(kind: "provinces" | "districts" | "wards", parentId?: number) {
  return useQuery({
    queryKey: ["shipping", "locations", kind, parentId ?? null],
    queryFn: async () => {
      const response = kind === "provinces" ? await shippingControllerProvinces()
        : kind === "districts" ? await shippingControllerDistricts({ provinceId: parentId })
        : await shippingControllerWards({ districtId: parentId });
      /* Swagger khai DTO trần, mutator giữ envelope: bóc đúng một lần tại hook như mọi dữ liệu server. */
      return bocData({ data: response as unknown as ApiResponse<ShippingLocationResponse[]> }, "shipping.locations");
    },
    enabled: !CHE_DO_MOCK && (kind === "provinces" || Boolean(parentId)),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}
