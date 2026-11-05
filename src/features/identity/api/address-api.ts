import { api } from "@/lib/api";
import { API_PREFIX } from "@/lib/api-mode";
import { bocData } from "@/lib/api/envelope";
import type { ApiResponse } from "@/types/common";
import type { AddressResponse as BeAddress } from "@/lib/api/generated/model";
import type { Address, AddressInputData } from "@/stores/address-store";

/*
 * Sổ địa chỉ trên server (`/users/me/addresses`) — adapter camelCase BE ↔ `Address` của FE.
 * Giữ cả mã và tên địa chỉ GHN đã chọn; đơn cũ thiếu mã vẫn đọc được và khách chọn lại trong form khi sửa.
 */
const chuoi = (v: unknown): string => (typeof v === "string" ? v : "");

function chuanHoa(a: BeAddress): Address {
  return { id: a.id, fullName: a.recipientName, phone: a.phone, province: a.provinceName, district: chuoi(a.districtName), ward: chuoi(a.wardName), street: a.street, isDefault: Boolean(a.isDefault),
    addressSystem: a.addressSystem === "legacy_3level" ? a.addressSystem : undefined,
    ghnProvinceId: a.ghnProvinceId ?? undefined, ghnDistrictId: a.ghnDistrictId ?? undefined, ghnWardCode: a.ghnWardCode ?? undefined };
}

const body = (a: AddressInputData) => ({ recipientName: a.fullName, phone: a.phone, provinceName: a.province, districtName: a.district || undefined, wardName: a.ward || undefined, street: a.street, isDefault: a.isDefault,
  addressSystem: a.addressSystem, ghnProvinceId: a.ghnProvinceId, ghnDistrictId: a.ghnDistrictId, ghnWardCode: a.ghnWardCode });

export const addressApi = {
  list: async (): Promise<Address[]> => bocData(await api.get<ApiResponse<BeAddress[]>>(`${API_PREFIX}/users/me/addresses`), "addresses").map(chuanHoa),
  add: async (a: AddressInputData): Promise<Address[]> => { await api.post(`${API_PREFIX}/users/me/addresses`, body(a)); return addressApi.list(); },
  update: async (id: string, a: AddressInputData): Promise<Address[]> => { await api.patch(`${API_PREFIX}/users/me/addresses/${id}`, body(a)); return addressApi.list(); },
  remove: async (id: string): Promise<Address[]> => { await api.delete(`${API_PREFIX}/users/me/addresses/${id}`); return addressApi.list(); },
  setDefault: async (id: string): Promise<Address[]> => { await api.put(`${API_PREFIX}/users/me/addresses/${id}/default`); return addressApi.list(); },
};
