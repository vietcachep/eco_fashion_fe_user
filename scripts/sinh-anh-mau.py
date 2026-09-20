"""
Sinh placeholder CỤC BỘ cho ảnh sản phẩm / danh mục / bộ sưu tập.

    python scripts/sinh-anh-mau.py

Không phụ thuộc mạng, tái lập được trên mọi máy. Mỗi ảnh: nền màu nhạt theo
danh mục, khối màu đậm gợi hình món đồ, tên sản phẩm, nhãn "ẢNH MẪU". Ảnh
thật do quản trị viên tải lên sau — thay file cùng tên là xong, code không đổi.
Nguồn tên/danh mục đọc thẳng từ `src/features/catalog/mock/products.ts`.
"""
from PIL import Image, ImageDraw, ImageFont
import os, re, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

GOC = os.path.join(os.path.dirname(__file__), "..")
os.chdir(GOC)
FONT = next((f for f in [r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf",
                         "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"] if os.path.exists(f)), None)
MAU = {"ao-thun": ("#fde8e4", "#ff6f61"), "ao-so-mi": ("#e8eef7", "#4b6cb7"), "quan-jean": ("#e3ebf4", "#3b5b8a"),
       "quan-short": ("#e9f3e6", "#5c8a4a"), "vay": ("#f7e6f0", "#b85c8a"), "dam": ("#f3e6f7", "#8a4bb8"),
       "ao-khoac": ("#ede9e3", "#6b5b4a")}

def font(sz):
    return ImageFont.truetype(FONT, sz) if FONT else ImageFont.load_default()

def ve(path, w, h, nen, dam, ten, hover=False):
    im = Image.new("RGB", (w, h), nen); d = ImageDraw.Draw(im)
    mx, my = w*0.5 + (w*0.06 if hover else 0), h*0.44
    d.rounded_rectangle([mx-w*0.22, my-h*0.22, mx+w*0.22, my+h*0.22], radius=int(w*0.06), fill=dam)
    d.rounded_rectangle([mx-w*0.30, my-h*0.20, mx-w*0.20, my-h*0.02], radius=int(w*0.04), fill=dam)
    d.rounded_rectangle([mx+w*0.20, my-h*0.20, mx+w*0.30, my-h*0.02], radius=int(w*0.04), fill=dam)
    ft, fs = font(int(w*0.055)), font(int(w*0.036))
    dong, cur = [], ""
    for t in ten.split():
        thu = (cur + " " + t).strip()
        if d.textlength(thu, font=ft) > w*0.84 and cur: dong.append(cur); cur = t
        else: cur = thu
    if cur: dong.append(cur)
    y = h*0.72
    for ln in dong[:3]:
        d.text((w/2, y), ln, font=ft, fill="#101828", anchor="mm"); y += int(w*0.07)
    d.text((w/2, h-int(w*0.05)), "ẢNH MẪU", font=fs, fill="#98a2b3", anchor="mm")
    os.makedirs(os.path.dirname(path), exist_ok=True); im.save(path, quality=82)

def ve_mau(path, w, h, nen, mau, ten, hover=False):
    """Ảnh THEO MÀU: khối áo tô đúng mã màu của biến thể (Vineta đổi ảnh khi chọn màu)."""
    im = Image.new("RGB", (w, h), nen); d = ImageDraw.Draw(im)
    mx, my = w*0.5 + (w*0.06 if hover else 0), h*0.44
    vien = "#c9c9c9" if mau.lower() in ("#f5f5f5", "#ffffff", "#fff") else None
    d.rounded_rectangle([mx-w*0.22, my-h*0.22, mx+w*0.22, my+h*0.22], radius=int(w*0.06), fill=mau, outline=vien, width=3)
    d.rounded_rectangle([mx-w*0.30, my-h*0.20, mx-w*0.20, my-h*0.02], radius=int(w*0.04), fill=mau, outline=vien, width=3)
    d.rounded_rectangle([mx+w*0.20, my-h*0.20, mx+w*0.30, my-h*0.02], radius=int(w*0.04), fill=mau, outline=vien, width=3)
    ft, fs = font(int(w*0.055)), font(int(w*0.036))
    dong, cur = [], ""
    for t in ten.split():
        thu = (cur + " " + t).strip()
        if d.textlength(thu, font=ft) > w*0.84 and cur: dong.append(cur); cur = t
        else: cur = thu
    if cur: dong.append(cur)
    y = h*0.72
    for ln in dong[:3]:
        d.text((w/2, y), ln, font=ft, fill="#101828", anchor="mm"); y += int(w*0.07)
    d.text((w/2, h-int(w*0.05)), "ẢNH MẪU", font=fs, fill="#98a2b3", anchor="mm")
    os.makedirs(os.path.dirname(path), exist_ok=True); im.save(path, quality=82)

src = open("src/features/catalog/mock/products.ts", encoding="utf-8").read()
# bảng màu: `den:   { name: "Đen", hex: "#1c1c1c" }`
MAU_HEX = dict(re.findall(r'(\w+):\s*\{\s*name:\s*"[^"]+",\s*hex:\s*"(#[0-9a-fA-F]{6})"', src))
sp = re.findall(r'slug:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*cat:\s*"([^"]+)".*?mau:\s*\[([^\]]+)\]', src)
tong = 0
for slug, name, cat, mau in sp:
    nen, _ = MAU.get(cat, ("#f2f4f7", "#667085"))
    for key in re.findall(r'MAU\.(\w+)', mau):
        hexm = MAU_HEX[key]
        ve_mau(f"public/images/products/{slug}/{key}-1.jpg", 900, 1200, nen, hexm, name)
        ve_mau(f"public/images/products/{slug}/{key}-2.jpg", 900, 1200, nen, hexm, name, hover=True)
        tong += 2
print("san pham:", len(sp), "| anh theo mau:", tong)

for slug, ten in [("ao-thun","Áo thun"),("ao-so-mi","Áo sơ mi"),("quan-jean","Quần jean"),("quan-short","Quần short"),
                  ("vay","Váy"),("dam","Đầm"),("ao-khoac","Áo khoác")]:
    nen, dam = MAU[slug]; ve(f"public/images/categories/{slug}.jpg", 800, 800, nen, dam, ten)
for slug, ten, cat in [("nu","Thời trang nữ","dam"),("nam","Thời trang nam","ao-so-mi"),
                       ("hang-moi","Hàng mới về","ao-thun"),("dam","Đầm dự tiệc","dam")]:
    nen, dam = MAU[cat]; ve(f"public/images/collections/{slug}.jpg", 900, 1200, nen, dam, ten)
print("danh muc: 7 | bo suu tap: 4")

# nền dải tiêu đề trang (Vineta: /images/section/page-title.jpg) — gradient nhẹ, không chữ
im = Image.new("RGB", (1920, 420), "#fff1ef"); d = ImageDraw.Draw(im)
for x in range(1920):
    t = x / 1919
    r = int(0xff); g = int(0xf1 + (0xf5 - 0xf1) * t); b = int(0xef + (0xf5 - 0xef) * t)
    d.line([(x, 0), (x, 420)], fill=(r, g, b))
os.makedirs("public/images/section", exist_ok=True); im.save("public/images/section/page-title.jpg", quality=85)
print("page-title.jpg ok")
