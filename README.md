# 🐾 Xám Pet Shop - E-Commerce Platform

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Một nền tảng thương mại điện tử hiện đại, đầy đủ tính năng dành riêng cho cửa hàng thú cưng (Pet Shop). Hệ thống được xây dựng với kiến trúc **Monolithic** sử dụng Node.js (Express), cơ sở dữ liệu MongoDB và giao diện người dùng Server-Side Rendering kết hợp Vanilla JS + Tailwind CSS mang lại trải nghiệm tối ưu.

---

## ✨ Tính năng nổi bật (Features)

### 🛍️ Dành cho Khách hàng (Customer)
- **Xác thực & Bảo mật:** Đăng ký, Đăng nhập với JWT (JSON Web Tokens).
- **Trải nghiệm mua sắm:** Xem danh sách, tìm kiếm, lọc sản phẩm theo danh mục/thương hiệu.
- **Giỏ hàng & Thanh toán:** Quản lý giỏ hàng thông minh, hỗ trợ thanh toán trực tuyến qua **VNPay** và thanh toán khi nhận hàng (COD).
- **Đánh giá & Phản hồi (Reviews):** Viết đánh giá sản phẩm, xếp hạng sao, chỉnh sửa/xóa đánh giá cá nhân. Khách hàng có thể tương tác trực tiếp với phản hồi từ cửa hàng.
- **Quản lý tài khoản:** Xem lại lịch sử mua hàng, trạng thái đơn hàng và hủy đơn hàng linh hoạt.

### 🛡️ Dành cho Quản trị viên (Admin)
- **Dashboard Tổng quan:** Theo dõi doanh thu theo thời gian thực (biểu đồ), đếm tổng đơn hàng, người dùng mới, và sản phẩm sắp hết hàng.
- **Quản lý Đơn hàng (Order Management):** Duyệt đơn, cập nhật trạng thái (Chờ duyệt, Đang giao, Đã giao, Đã hủy).
- **Quản lý Sản phẩm & Kho (Inventory):** Thêm, sửa, xóa sản phẩm, tải ảnh lên Cloud/Local.
- **Quản lý Khách hàng & Phân quyền:** Xem danh sách khách hàng, cấp quyền admin.
- **Tương tác Đánh giá:** Trả lời đánh giá của khách hàng (Admin Reply) và xóa phản hồi nếu cần.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript
- **Security:** bcryptjs (Mã hóa mật khẩu), jsonwebtoken (JWT Auth)
- **Thanh toán:** Tích hợp cổng thanh toán VNPay
- **Khác:** multer (Xử lý upload file)

---

## 🚀 Hướng dẫn Cài đặt & Chạy dự án (Installation)

### 1. Yêu cầu hệ thống (Prerequisites)
- [Node.js](https://nodejs.org) (phiên bản v18 trở lên)
- [MongoDB](https://www.mongodb.com/) (Local hoặc MongoDB Atlas)

### 2. Cài đặt các gói phụ thuộc (Install Dependencies)
Clone dự án về máy và chạy lệnh sau trong thư mục gốc:
```bash
npm install
```

### 3. Cấu hình biến môi trường (Environment Variables)
Tạo file `.env` ở thư mục gốc và cấu hình các thông số sau:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/petshop

# Security
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Cấu hình VNPay (Nếu có)
VNP_TMNCODE=your_tmn_code
VNP_HASHSECRET=your_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURNURL=http://localhost:5000/api/vnpay/vnpay_return
```

### 4. Nạp dữ liệu mẫu (Seeding Database)
Dự án cung cấp sẵn file seed để khởi tạo tài khoản Admin và các sản phẩm mẫu:
```bash
npm run seed
```
*Lưu ý: Lệnh này sẽ xóa toàn bộ dữ liệu cũ trong DB và tạo mới.*
- Tài khoản Admin mẫu: `admin@example.com` / `admin123`
- Tài khoản Khách mẫu: `customer1@example.com` / `123456`

### 5. Khởi chạy Server
Chạy trong môi trường phát triển (tự động reload khi sửa code):
```bash
npm run dev
```
Chạy trong môi trường Production:
```bash
npm start
```
Server sẽ mặc định khởi chạy tại: `http://localhost:5000`

---

## 📁 Cấu trúc thư mục (Folder Structure)

```text
E-commerce-pet-shop/
├── src/
│   ├── app.js                 # Entry point của ứng dụng
│   ├── config/                # Cấu hình DB, VNPay...
│   ├── controllers/           # Xử lý logic nghiệp vụ (Auth, Product, Review...)
│   ├── middlewares/           # Auth guard, Admin role, Upload file
│   ├── models/                # Mongoose Schemas (User, Product, Order, Review...)
│   ├── routes/                # Định tuyến API và điều hướng trang
│   └── views/                 # Giao diện frontend (HTML, JS, CSS)
├── .env                       # Biến môi trường
├── seed.js                    # Script khởi tạo dữ liệu mẫu
└── package.json
```

---

## 📄 Giấy phép (License)
Dự án được xây dựng cho mục đích học tập và phát triển cá nhân.

*© 2026 Xám Pet Shop. All rights reserved.*
