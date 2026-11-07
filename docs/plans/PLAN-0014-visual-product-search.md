# PLAN-0014 — Tìm sản phẩm theo ảnh và vùng chọn

> Status: Implemented — chờ nghiệm thu trình duyệt · 2026-11-06 · Backend PLAN-0044-visual-product-search.md.

## Phạm vi và thiết kế

Nâng AiImageSearchScreen trong feature catalog, giữ Vineta (Be Vietnam Pro nội dung, Playfair tiêu đề, primary coral/white/dark tokens hiện tại). Bố cục preview/vùng chọn ở trái, kết quả phải; mobile390px một cột. Điểm nhấn duy nhất là khung chọn vùng món trên ảnh. Luồng: chọn ảnh→nhận diện món (optional)→chọn món hoặc crop thủ công→tìm→ảnh sản phẩm khớp/màu/lý do. Crop bằng canvas trên client, bàn phím chỉnh bốn toạ độ phần trăm + nút toàn ảnh; người mặc đồ không bị loại. Không thay global ProductCard/API/state; dữ liệu price do BE.

## Contract

POST /ai/image-search/analyze multipart image; POST /ai/image-search multipart image,target?; response cũ được giữ, thêm matches/regions/searchMode. Wrap generated fetchers trong feature catalog. Không lưu ảnh khách trong localStorage; revoke object URLs khi thay ảnh/rời màn. Không tự tính confidence%, ghi similar/related rõ ràng. Hiển thị degraded khi vector/rerank không sẵn sàng; có cancel bỏ kết quả request cũ và chặn double submit.

## Checklist

- [x] Generated API typed và feature adapter.
- [x] Chọn món/crop pointer + keyboard, canvas và giới hạn file.
- [x] Kết quả dùng ảnh màu khớp, nhãn tương tự/liên quan và giải thích trên từng sản phẩm.
- [x] Loading/error/empty/unavailable, thay ảnh không nhận kết quả request cũ.
- [x] Lint/typecheck/build production34 trang; hai cảnh báo img có sẵn ở account-shell/profile-screen.
- [x] Dừng API/Chrome; xoá encoder/DB/Redis audit, volume và image encoder audit; xác minh không còn listener audit.
- [ ] Xoá .visual-browser-audit và ba log fitly-visual-*.log trong TEMP: lệnh dọn bị automatic review chặn (`blocked by policy`).
- [ ] Browser390px/desktop: chưa kiểm vì thao tác mở server FE local bị automatic review từ chối (`blocked by policy`).

## Kiểm chất lượng

Ảnh một vật, người mặc đồ, nhiều món, crop không hợp lệ/tiny, ảnh sai định dạng, backend lỗi/mất index; pagination/checkout ngoài phạm vi. Benchmark retrieval ở BE, không công bố accuracy từ mock.

HTTP trên API audit đã trả200 cho analyze và search, dùng encoder thật và trả đúng ảnh fixture. Chưa nghiệm thu OpenAI thật hoặc bộ ảnh held-out. Chưa push/deploy. Hướng dẫn bật encoder và reindex: eco_backend/services/visual-encoder/README.md.
