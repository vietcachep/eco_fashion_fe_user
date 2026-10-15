import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";
import { DANH_MUC } from "@/features/catalog/mock/categories";
import { MA_LOI_DANG_KY as MA, type ShopRegistrationResponse, type SubmitShopRegistrationRequest } from "@/features/seller/types";

/*
 * "MÁY CHỦ MẪU" của đăng ký bán hàng (chế độ không có backend — `NEXT_PUBLIC_API_URL` trống). `api/registration-api.ts`
 * gọi vào đây khi `CHE_DO_MOCK`; có backend thì file này không nằm trên đường chạy thật. Hồ sơ lưu ở localStorage
 * (`fashion-mock-shop-registrations`), mô phỏng đúng các luật + mã lỗi của PLAN-0019 §7 (lỗi ném dưới dạng AxiosError
 * giả mang `error.code`, nên màn hình đọc lỗi bằng đúng một đường như khi có backend).
 *
 * ★ CÁCH THỬ CÁC TRẠNG THÁI (chỉ có ở chế độ mẫu — "sàn duyệt" được mô phỏng sau ~6 giây, bấm "Kiểm tra lại" để thấy):
 *   - tên gian hàng chứa `demo-duyet`  → đã duyệt
 *   - tên gian hàng chứa `demo-tuchoi` → bị từ chối (có lý do, nút "Nộp lại")
 *   - tên gian hàng chứa `demo-khoa`   → bị tạm khoá (KHÔNG có lý do: BE chỉ chép lý do khi từ chối, xem `types`)
 *   - tên khác                          → ở lại "chờ duyệt"
 * ★ Các lỗi khác thử được: tên trùng ("FITLY Official", "Áo Thun Xinh" hoặc tên của một hồ sơ đang chờ/đã duyệt khác);
 *   tài khoản có email bắt đầu `admin`/`staff`/`nhanvien` → SHOP_REGISTRATION_NOT_ELIGIBLE; nộp lần thứ 16 trong 24 giờ → 429
 *   (BE: 15 lần/ngày/người, TÍNH CẢ lần nộp bị lỗi — nên mock đếm riêng các lượt nộp, không chỉ hồ sơ đã tạo).
 */
const KHOA_LUU = "fashion-mock-shop-registrations";
const KHOA_LUOT_NOP = "fashion-mock-shop-registration-attempts";
const SAU_BAO_LAU_MS = 6_000;
const GIOI_HAN_NOP = 15;
const MOT_NGAY_MS = 24 * 60 * 60 * 1000;
const TEN_DA_CO_NGUOI_DUNG = ["fitly official", "fitly store", "áo thun xinh"];

type HoSoMau = ShopRegistrationResponse & { ownerEmail: string };

const cho = (ms: number) => new Promise((r) => setTimeout(r, ms));

function docTatCa(): HoSoMau[] {
  try { return JSON.parse(localStorage.getItem(KHOA_LUU) ?? "[]") as HoSoMau[]; } catch { return []; }
}
function ghiTatCa(ds: HoSoMau[]) {
  try { localStorage.setItem(KHOA_LUU, JSON.stringify(ds)); } catch { /* trình duyệt chặn lưu: mẫu chỉ mất dữ liệu, không vỡ */ }
}

/* Các lượt nộp (mốc thời gian, ms) theo email — đếm cho giới hạn 15 lần/24 giờ, kể cả lượt bị từ chối vì lỗi. */
function docLuotNop(email: string): number[] {
  try {
    const t = (JSON.parse(localStorage.getItem(KHOA_LUOT_NOP) ?? "{}") as Record<string, number[]>)[email];
    return Array.isArray(t) ? t : [];
  } catch { return []; }
}
function ghiLuotNop(email: string, ds: number[]) {
  try {
    const tatCa = JSON.parse(localStorage.getItem(KHOA_LUOT_NOP) ?? "{}") as Record<string, number[]>;
    localStorage.setItem(KHOA_LUOT_NOP, JSON.stringify({ ...tatCa, [email]: ds }));
  } catch { /* như trên: chỉ mất bộ đếm, không vỡ */ }
}

/* Lỗi HTTP giả có envelope `{success:false, error:{code,message}}` — `lib/api-error` đọc được như lỗi thật. */
function loiApi(status: number, ma: string, message: string): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  const response: AxiosResponse = { status, statusText: "", headers: {}, config, data: { success: false, data: null, message, error: { code: ma, message } } };
  return new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, null, response);
}

const emailHienTai = () => useAuthStore.getState().user?.email.toLowerCase() ?? "";
const chuanTen = (ten: string) => ten.trim().replace(/\s+/g, " ").toLowerCase();
/* So khớp từ khoá demo không phân biệt hoa/thường (tên có dấu vẫn đọc bình thường vì từ khoá toàn ASCII). */
const coTuKhoa = (ten: string, tuKhoa: string) => chuanTen(ten).includes(tuKhoa);

/* Quyết định "của sàn" theo từ khoá trong tên — null = chưa có quyết định (ở lại chờ duyệt). */
function quyetDinhTheoTen(ten: string): Pick<ShopRegistrationResponse, "status" | "rejectReason"> | null {
  if (coTuKhoa(ten, "demo-duyet")) return { status: "approved", rejectReason: null };
  if (coTuKhoa(ten, "demo-tuchoi")) return { status: "rejected", rejectReason: "Tên gian hàng và mô tả chưa rõ ngành hàng kinh doanh. Vui lòng bổ sung thông tin cụ thể rồi nộp lại hồ sơ." };
  /* Khoá: không có lý do trong hồ sơ — đúng hợp đồng BE (`rejectReason` chỉ có khi `rejected`). */
  if (coTuKhoa(ten, "demo-khoa")) return { status: "suspended", rejectReason: null };
  return null;
}

/* Hồ sơ đang chờ mà đã quá ~6 giây thì áp quyết định mô phỏng (ghi lại để lần đọc sau ổn định). */
function apDungQuyetDinh(ds: HoSoMau[]): HoSoMau[] {
  const bay = Date.now();
  let doi = false;
  const kq = ds.map((h) => {
    if (h.status !== "pending" || bay - new Date(h.submittedAt).getTime() < SAU_BAO_LAU_MS) return h;
    const qd = quyetDinhTheoTen(h.shopName);
    if (!qd) return h;
    doi = true;
    return { ...h, ...qd, decidedAt: new Date(bay).toISOString(), canReapply: qd.status === "rejected" };
  });
  if (doi) ghiTatCa(kq);
  return kq;
}

const boTruongMau = ({ ownerEmail: _bo, ...h }: HoSoMau): ShopRegistrationResponse => { void _bo; return h; };

/* Hồ sơ MỚI NHẤT của tôi; chưa từng đăng ký ⇒ null (như `GET /shop/registrations/me`). */
export async function mockLayHoSoCuaToi(): Promise<ShopRegistrationResponse | null> {
  await cho(400);
  const email = emailHienTai();
  const cua = apDungQuyetDinh(docTatCa()).filter((h) => h.ownerEmail === email);
  const moiNhat = [...cua].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
  return moiNhat ? boTruongMau(moiNhat) : null;
}

export async function mockNopHoSo(body: SubmitShopRegistrationRequest): Promise<ShopRegistrationResponse> {
  await cho(700);
  const email = emailHienTai();
  const tatCa = apDungQuyetDinh(docTatCa());
  const cua = tatCa.filter((h) => h.ownerEmail === email);
  const bay = Date.now();

  /* Giới hạn của BE đứng TRƯỚC mọi kiểm tra khác và đếm cả lần nộp bị lỗi ⇒ ghi lượt nộp ngay tại đây. */
  const luotTrongNgay = docLuotNop(email).filter((t) => bay - t < MOT_NGAY_MS);
  if (luotTrongNgay.length >= GIOI_HAN_NOP) {
    throw loiApi(429, MA.rateLimited, "Quá nhiều lần nộp hồ sơ trong 24 giờ");
  }
  ghiLuotNop(email, [...luotTrongNgay, bay]);
  if (/^(admin|staff|nhanvien)/i.test(email.split("@")[0] ?? "")) {
    throw loiApi(403, MA.notEligible, "Tài khoản nhân viên sàn không đăng ký bán hàng được");
  }
  if (cua.some((h) => h.status === "approved" || h.status === "suspended")) {
    throw loiApi(409, MA.alreadyMember, "Người dùng đã thuộc một gian hàng");
  }
  if (cua.some((h) => h.status === "pending")) {
    throw loiApi(409, MA.pending, "Đã có hồ sơ đăng ký đang chờ duyệt");
  }
  const nganh = DANH_MUC.find((c) => c.id === body.categoryId);
  if (!nganh) throw loiApi(400, MA.categoryInvalid, "Ngành hàng không tồn tại hoặc không hoạt động");
  const ten = chuanTen(body.shopName);
  const trung = TEN_DA_CO_NGUOI_DUNG.includes(ten) || tatCa.some((h) => h.status !== "rejected" && chuanTen(h.shopName) === ten);
  if (trung) throw loiApi(409, MA.nameTaken, "Tên gian hàng đã được sử dụng");

  const stt = tatCa.length + 1;
  const hoSo: HoSoMau = {
    ownerEmail: email,
    id: `mock-reg-${bay.toString(36)}`,
    shopId: `mock-shop-${bay.toString(36)}`,
    shopCode: `SH${String(100000 + stt)}`,
    shopName: body.shopName,
    status: "pending",
    representativeName: body.representativeName,
    phone: body.phone,
    category: { id: nganh.id, name: nganh.name },
    description: body.description ?? null,
    submittedAt: new Date(bay).toISOString(),
    decidedAt: null,
    rejectReason: null,
    canReapply: false,
  };
  ghiTatCa([...tatCa, hoSo]);
  return boTruongMau(hoSo);
}
