/*
 * MỐC GIÁ cho thanh kéo lọc giá. Sàn đa ngành hàng có giá trải từ vài chục nghìn (đồ ăn vặt) tới ~30 triệu (laptop,
 * điện thoại): thanh kéo tuyến tính 0–1 triệu như trước không lọc được hàng đắt, còn thanh tuyến tính 0–30 triệu thì
 * kéo ở khoảng 100–500k (nơi phần lớn hàng nằm) cực kỳ thô. Dùng các MỐC "đẹp" thưa dần: thanh kéo chạy theo chỉ số
 * mốc (bước 1), giá trị thật là `moc[chỉ số]`.
 *
 * Mốc cuối ≥ giá cao nhất của catalog và nghĩa là "không giới hạn trên" (không gửi `maxPrice`); mốc đầu 0 = "không
 * giới hạn dưới".
 */
const MOC_DEP = [
  0, 50_000, 100_000, 200_000, 300_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000,
  7_500_000, 10_000_000, 15_000_000, 20_000_000, 30_000_000, 50_000_000, 100_000_000,
] as const;

const MAC_DINH_TOI_DA = 1_000_000;

export function taoMocGia(giaCaoNhat: number): number[] {
  const m = giaCaoNhat > 0 ? giaCaoNhat : MAC_DINH_TOI_DA;
  const duoi = MOC_DEP.filter((x) => x < m);
  const cuoi = MOC_DEP.find((x) => x >= m) ?? Math.ceil(m / 1_000_000) * 1_000_000;
  return [...duoi, cuoi];
}

/* Chỉ số mốc gần giá trị `gia` nhất (giá trên URL có thể gõ tay, không nằm đúng mốc). */
export function chiSoMocGanNhat(moc: number[], gia: number): number {
  let tot = 0;
  for (let i = 1; i < moc.length; i++) {
    if (Math.abs(moc[i] - gia) < Math.abs(moc[tot] - gia)) tot = i;
  }
  return tot;
}
