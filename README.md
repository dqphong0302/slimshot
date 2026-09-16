# ⚡ SlimShot — Batch Image Compression & Conversion Tool

> UI nền tảng: **PhongDang UI (PDUI) v1.6.0** · profile `tool` · manifest tại `vendor/pdui/pdui-manifest.json`.

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-emerald.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Platform](https://img.shields.io/badge/platform-Client--Side%20Web%20App-purple.svg)
![Design System](https://img.shields.io/badge/UI-PDUI%20v1.6.0-1e40af.svg)

**Công cụ nén ảnh và chuyển đổi định dạng hàng loạt (JPG, PNG, WebP) xử lý 100% trong RAM trình duyệt.**

🌐 **Trải nghiệm trực tuyến:** [https://slimshot.phongdang.io.vn](https://slimshot.phongdang.io.vn)  
🏛️ **Hệ sinh thái:** [https://phongdang.io.vn](https://phongdang.io.vn) • [https://classtools.vn](https://classtools.vn)  
📦 **Kho mã nguồn:** [https://github.com/dqphong0302/slimshot](https://github.com/dqphong0302/slimshot)

</div>

---

## 🌟 Giới Thiệu & Sứ Mệnh

Hình ảnh thường chiếm phần lớn dung lượng trên website và các nền tảng số. **SlimShot** được xây dựng nhằm giúp người dùng:
- **Giảm tới 80% dung lượng** mà vẫn giữ nguyên độ nét thị giác.
- **Tự động chuyển đổi WebP** hoặc chọn định dạng tối ưu nhất theo từng ảnh.
- **Xử lý hàng loạt (Batch Processing)** lên tới 30 ảnh cùng lúc và tải về trọn bộ file `.zip`.
- **100% Client-side**: Xử lý trực tiếp trong RAM, không bao giờ gửi ảnh lên bất kỳ máy chủ nào.

---

## ✨ Tính Năng Nổi Bật

### 1. ⚡ Xử Lý Hàng Loạt & Tải File .Zip
- Kéo thả đồng thời nhiều ảnh (tối đa 30 ảnh/lượt, $\le 50\text{MB}$/ảnh).
- Hàng đợi (queue) xử lý tuần tự mượt mà, không làm đơ trình duyệt.
- Nút **"Tải tất cả (.zip)"** đóng gói tự động toàn bộ file đã tối ưu chỉ trong 1 click (`slimshot-bundle.zip`).

### 2. 🎛️ Chuyển Đổi Định Dạng Thông Minh (Smart Format Conversion)
- **Tự động (Auto)**: Hệ thống tự thử nghiệm cả WebP và định dạng gốc, chọn phương án có dung lượng nhỏ nhất.
- **WebP**: Chuyển đổi sang WebP thế hệ mới, tối ưu cho SEO và tốc độ tải trang.
- **JPG / JPEG**: Nén ảnh tương thích phổ biến.
- **PNG**: Tối ưu lại cấu trúc PNG.
- **Giữ gốc**: Nén ảnh nhưng giữ nguyên định dạng file ban đầu.

### 3. 📐 Thu Nhỏ Kích Thước Quá Khổ (Smart Max-Width Resize)
- Tự động hạ tỷ lệ ảnh nếu bề ngang vượt quá ngưỡng cấu hình (mặc định $\le 2000\text{px}$, tùy chỉnh $200-8000\text{px}$).

### 4. 🔍 Thanh Trượt So Sánh Trước / Sau (Compare Slider)
- Cửa sổ Modal so sánh trực quan với thanh kéo Split View 50/50 giúp người dùng kiểm tra độ nét của ảnh trước và sau khi nén.

### 5. 🛡️ Cơ Chế Bảo Vệ Dung Lượng (Never Inflate)
- Nếu ảnh sau khi nén bị lớn hơn ảnh gốc, hệ thống tự động giữ nguyên file gốc và gắn nhãn *"Đã tối ưu sẵn"*.

### 6. 🎨 Chuẩn Thiết Kế PhongDang UI (PDUI v1.6.0)
- Tông màu chủ đạo Navy Blue (`#1e40af` / dark `#60a5fa`) sang trọng và hiện đại.
- Hỗ trợ chế độ Sáng / Tối (Light & Dark theme) mượt mà, đồng bộ với toàn hệ sinh thái qua `pd_theme`.

---

## 🛠️ Công Nghệ Nền Tảng

- **Bundler / Tooling**: [Vite](https://vite.dev/) 8.x
- **Image Processing**: HTML5 Canvas API, `createImageBitmap`, Bicubic Resampling
- **Zip Packaging**: [JSZip](https://stuk.github.io/jszip/)
- **UI Framework**: PhongDang UI Design System (PDUI v1.6.0)
- **Deployment Target**: Cloudflare Pages / Workers Static Assets

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### Yêu cầu môi trường:
- Node.js >= 18.0.0
- npm hoặc pnpm

### Các bước thực hiện:

```bash
# 1. Di chuyển vào thư mục dự án
cd SlimShot

# 2. Cài đặt dependencies
npm install

# 3. Khởi chạy dev server
npm run dev

# 4. Đóng gói bản phát hành production
npm run build

# 5. Xem trước bản build production
npm run preview
```

---

## 👨‍🏫 Tác Giả & Bản Quyền

- **Tác giả**: ThS. Đặng Quốc Phong (Quoc-Phong Dang, M.Sc.)
- **Đơn vị**: Giảng viên Bộ môn Tin học, Khoa Khoa học Cơ bản — Trường Đại học Y Dược TP. Hồ Chí Minh (UMP HCMC)
- **Website**: [phongdang.io.vn](https://phongdang.io.vn) • [classtools.vn](https://classtools.vn)
- **Email**: `dqphong@ump.edu.vn` • `dqphong0302@gmail.com`
- **Giấy phép**: Phát hành theo giấy phép [MIT License](LICENSE).
