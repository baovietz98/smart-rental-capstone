# 🏠 Smart Rental Management System (SaaS)

**Role:** Senior Fullstack Developer
**Team:** Solo Dev
**Deadline:** Feb 2026

---

## 1. Tổng quan dự án

Hệ thống quản lý nhà trọ, căn hộ dịch vụ và chung cư mini đa nền tảng.
Dự án tập trung vào **tính chính xác của dữ liệu tài chính** (hóa đơn, điện nước, công nợ, thanh toán từng phần) và **tự động hóa quy trình quản lý**.

### Trải nghiệm Người dùng (UX/UI Strategy)

Theo hành vi thực tế, khách thuê thường lười tải ứng dụng riêng. Do đó, hệ thống được thiết kế phân chia nền tảng thông minh:

*   **Web Portal (Responsive Mobile-First):** Phục vụ cho **CẢ ADMIN (Chủ nhà) VÀ TENANT (Khách thuê)**.
    *   **Admin:** Dashboard Command Center chuyên sâu, biểu đồ, quản lý chi tiết.
    *   **Tenant:** Đăng nhập qua trình duyệt web trên điện thoại mượt mà như app thật để xem hóa đơn, hợp đồng, báo cáo sự cố (Không cần tải app).
*   **Mobile App:** Dành **RIÊNG CHO ADMIN**. Tiện lợi để chủ nhà cầm điện thoại đi chốt số điện nước các tầng/vòng, nhận thông báo sự cố tức thời, và kiểm tra nhanh tình trạng khi không ngồi máy tính.

---

## 2. Kiến trúc & Tech Stack

### A. System Architecture (Monorepo-style)

```text
quan-ly-nha-tro/
├── backend/            # NestJS 11 - RESTful API
├── web-admin/          # Next.js (App Router) - Admin & Tenant Portal
├── mobile-app/         # Expo (React Native) - Admin Only App
└── docker-compose.yml  # PostgreSQL Infrastructure
```

### B. Technology Details

*   **Database:** PostgreSQL
*   **ORM:** Prisma 6
*   **Backend:** NestJS 11, Passport-JWT, Swagger (OpenAPI), class-validator, Bcrypt.
*   **Frontend Web (Admin & Tenant):** Next.js 14/15, TailwindCSS v4, Ant Design, Axios, Lucide React.
*   **Mobile App (Admin Only):** Expo, React Native, Nativewind (Tailwind), React Navigation, Expo Router, Tanstack Query (React Query).

---

## 3. Core Business Logic & Workflows

### A. Hierarchy (Cấu trúc dữ liệu)

`Building -> Room -> Contract -> Tenant (with User Account)`

### B. Quy trình Tính tiền & Hóa đơn (Billing Engine)

Đây là trái tim của hệ thống.
*   **Services:** Phân loại `INDEX` (có chỉ số đầu/cuối như Điện, Nước) và `FIXED` (Cố định như Rác, Wifi). Có các cơ chế tính `PER_ROOM`, `PER_PERSON`, `PER_USAGE`.
*   **Chốt chỉ số (ServiceReadings):** Admin đi chốt số điện nước hàng tháng. Hệ thống tự tính toán lượng tiêu thụ và thành tiền.
*   **Hóa đơn (Invoices):** 
    *   Bao gồm: Tiền phòng + Tiền dịch vụ + Nợ cũ (Previous Debt) + Phí phát sinh (Extra Charge) - Giảm giá (Discount).
    *   Hỗ trợ **Thanh toán từng phần (PARTIAL)**. Khi khách thanh toán chưa đủ, hóa đơn ở trạng thái `PARTIAL`, phần thiếu sẽ cộng dồn thành `debtAmount` hoặc `previousDebt` cho tháng sau.
    *   Trạng thái Hóa đơn: `DRAFT`, `PUBLISHED`, `PARTIAL`, `PAID`, `OVERDUE`, `CANCELLED`.
*   **Giao dịch (Transactions):** Bản ghi chi tiết mọi khoản thu/chi (Tiền cọc, thanh toán hóa đơn...).

### C. Quản lý Phòng & Hợp đồng
*   **Room Status:** `AVAILABLE`, `RENTED`, `MAINTENANCE`.
*   Khi Contract hết hạn hoặc hủy, phòng tự động trở về `AVAILABLE`.
*   Hỗ trợ **Move Room Wizard** (Chuyển phòng an toàn, bảo lưu cọc/nợ).

### D. Tương tác Khách thuê - Chủ nhà
*   **Issues/GuestRequests:** Khách thuê tạo ticket/báo cáo sự cố hoặc khách đến chơi từ Web Portal. Admin nhận trên Web/Mobile App và xử lý (`OPEN`, `PROCESSING`, `DONE`).
*   **Notifications:** Thông báo hệ thống thời gian thực về Hóa đơn mới, thanh toán thành công, cập nhật sự cố.

---

## 4. Database Schema (Prisma)

Cấu trúc DB thực tế tham khảo từ `schema.prisma`:

*   **User & Tenant:** `User` chứa thông tin đăng nhập (Role: `ADMIN`, `TENANT`), link `1-1` với `Tenant` chứa thông tin thuê (CCCD, Xe cộ).
*   **Contract:** Lưu trữ `price`, `deposit`, `paymentDay`, `startDate`, `endDate`.
*   **Service & ServiceReading:** `oldIndex`, `newIndex`, `usage`, `totalCost`.
*   **Invoice:** `roomCharge`, `serviceCharge`, `debtAmount`, `paidAmount`, `status`, `lineItems`.
*   **Transaction:** `amount`, `type`, `invoiceId`.

---

## 5. Development Strategy (Quy tắc cho AI Assistant)

**Nguyên tắc chung:**
1.  **Backend First:** Viết Schema -> Migration -> RESTful API (DTOs, class-validator) -> Swagger.
2.  **Shared Types:** Đảm bảo kiểu dữ liệu đồng nhất giữa schema Prisma và giao diện hiển thị.
3.  **Bảo mật:** Verify kĩ quyền trên Controller (Admin vs Tenant guards). Không leak thông tin phòng khác cho Tenant.

**Frontend Web (Next.js):**
*   Lấy API làm gốc. Xử lý Server Components nếu phù hợp hoặc Client Components dùng Axios.
*   Dùng **Ant Design** kết hợp **Tailwind CSS v4** để dựng UI cao cấp. 
*   **AESTHETICS CHẤT LƯỢNG CAO:** Đi theo trường phái Command Center / Bento Grid, ưu tiên phối màu tinh tế. Không thiết kế giao diện quê mùa, đơn điệu.
*   **Responsive Cực Quan Trọng:** Vì Tenant dùng Web trên Mobile. Trải nghiệm lướt web trên điện thoại phải như một Native App thực thụ (Vuốt chạm mượt, nút bấm to rõ, không bị vỡ layout).

**Mobile App (Expo):**
*   Chỉ phục vụ cho **ADMIN**.
*   Tối ưu hóa các tính năng dễ dàng thao tác 1 tay (VD: Điền số điện).
*   Tính năng offline-capable bằng `React Query` persister (Có thể chốt điện nước ngay cả khi dưới tầng hầm không có Wi-Fi/4G, đồng bộ khi có mạng).
