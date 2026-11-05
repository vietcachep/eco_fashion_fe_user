/*
 * Tách chuỗi `shipping_address` của đơn ra các ô của form "Đổi địa chỉ". BE ghép chuỗi này từ `[số nhà/đường, phường/xã, quận/huyện, tỉnh/thành]` bỏ ô trống,
 * cách nhau ", " (`order.service.ts` lúc đặt và `changeAddress`) nhưng KHÔNG trả các phần riêng — nên tách ngược từ cuối: phần cuối là tỉnh/thành (không đổi được),
 * hai phần liền trước là quận/huyện rồi phường/xã, mọi thứ còn lại là số nhà + tên đường.
 *
 * Chuỗi thiếu cấp (ô trống đã bị bỏ) thì cấp ở giữa có thể rơi nhầm ô — chỉ ảnh hưởng điền sẵn: khách sửa được trong form, và BE ghép lại đúng thứ tự cũ nên
 * chuỗi gửi đi vẫn đúng. Riêng TỈNH/THÀNH là phần cuối chắc chắn; BE so khớp nó với tỉnh của đơn (không dấu, bỏ "TP."/"Tỉnh") nên sai là 409, không âm thầm đổi.
 */
export interface DiaChiDon { street: string; ward: string; district: string; province: string }

export function tachDiaChiDon(diaChi: string): DiaChiDon {
  const phan = diaChi.split(",").map((p) => p.trim()).filter(Boolean);
  const n = phan.length;
  if (n === 0) return { street: "", ward: "", district: "", province: "" };
  if (n === 1) return { street: "", ward: "", district: "", province: phan[0] };
  if (n === 2) return { street: phan[0], ward: "", district: "", province: phan[1] };
  if (n === 3) return { street: phan[0], ward: "", district: phan[1], province: phan[2] };
  return { street: phan.slice(0, n - 3).join(", "), ward: phan[n - 3], district: phan[n - 2], province: phan[n - 1] };
}
