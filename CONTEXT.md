# 🏠 Smart Rental Management System (SaaS)

**Role:** Senior Fullstack Developer
**Team:** Solo Dev
**Deadline:** Feb 2026

---

## 1. Tổng quan dự án

Hệ thống quản lý nhà trọ, căn hộ dịch vụ và chung cư mini.
Dự án tập trung vào **tính chính xác của dữ liệu tài chính** (hóa đơn, điện nước) và **tự động hóa quy trình quản lý**.

### Ràng buộc cốt lõi

* **Unit-based Management:** Quản lý theo **Phòng/Căn hộ (Unit)**. *KHÔNG* quản lý theo Giường/Ký túc xá.
* **Target Audience:**

  * **Admin (Chủ nhà):** Web Admin (quản lý tổng quan) + Mobile App (đi chốt điện nước).
  * **Tenant (Khách thuê):** Mobile App (xem hóa đơn, thanh toán QR, báo sự cố).

---

## 2. Kiến trúc & Tech Stack

### A. System Architecture (Manual Monorepo)

```
quan-ly-nha-tro/
├── backend/            # NestJS (Node.js) - RESTful API
│   ├── prisma/         # Schema Database (PostgreSQL)
│   └── src/            # Source code (Modules, Services, Controllers)
├── web-admin/          # Next.js 14+ (App Router) - Admin Portal
│   └── src/app/        # Pages & UI Components
├── mobile-app/         # Expo (React Native) - Super App (Admin & Tenant)
└── docker-compose.yml  # Infrastructure (PostgreSQL + PgAdmin)
```

### B. Technology Details

* **Database:** PostgreSQL (Dockerized)
* **ORM:** Prisma (Schema-first workflow)
* **Backend:** NestJS, Passport-JWT, Swagger (OpenAPI), class-validator
* **Frontend (Web):** Next.js, TailwindCSS, Ant Design, Axios
* **Mobile:** Expo, React Native Paper, Expo Router

---

## 3. Nghiệp vụ (AI phải tuân theo)

### A. Hierarchy (Cấu trúc dữ liệu)

`Building (Tòa nhà) -> Room (Phòng) -> Contract (Hợp đồng) -> Tenant (Khách)`

### B. Core Workflows (Quy trình chính)

#### 1. Quản lý Hợp đồng & Cư trú

* Room có trạng thái: `AVAILABLE`, `RENTED`, `MAINTENANCE`.
* Khi tạo **Contract (isActive = true)** → **Room** tự động chuyển sang `RENTED`.
* **Tenant:** Một hợp đồng có 1 người đại diện (Representative) và nhiều thành viên ở cùng.

#### 2. Quy trình Tính tiền (Billing Engine) — *Quan trọng nhất*

* **Input:** Chỉ số cũ & Chỉ số mới (Điện/Nước).
* **Công thức:**

```javascript
TotalBill = RoomPrice
          + (ElectricUsage * ElectricPrice)
          + (WaterUsage * WaterPrice)
          + FixedServices (Wifi, Rác...)
          + Debt (Nợ cũ)
```

* **Validation:** Chỉ số mới phải `>=` chỉ số cũ. Nếu nhỏ hơn (do quay vòng đồng hồ), cần cờ (flag) để xác nhận.

#### 3. Quy trình Sự cố (Issue Tracking)

* Tenant tạo Ticket (có thể kèm ảnh) → Chủ nhà nhận thông báo → Chủ nhà cập nhật trạng thái: `OPEN` → `PROCESSING` → `DONE`.

#### 4. Database Schema (Source of Truth)

*Dưới đây là cấu trúc DB chuẩn dùng cho Prisma. AI hãy dựa vào đây để viết code.*

```prisma
model Building {
  id          Int      @id @default(autoincrement())
  name        String
  address     String?
  rooms       Room[]
  createdAt   DateTime @default(now())
}

model Room {
  id          Int        @id @default(autoincrement())
  name        String     // P.101, P.102
  price       Float      // Giá thuê cơ bản
  area        Float?
  maxTenants  Int        @default(2)
  status      RoomStatus @default(AVAILABLE)
  
  buildingId  Int
  building    Building   @relation(fields: [buildingId], references: [id])
  
  assets      Json?      // Danh sách tài sản trong phòng
  contracts   Contract[]
  issues      Issue[]
}

enum RoomStatus {
  AVAILABLE
  RENTED
  MAINTENANCE
}

model Tenant {
  id          Int        @id @default(autoincrement())
  fullName    String
  phone       String     @unique
  cccd        String?
  info        Json?      // Ảnh CCCD, quê quán
  contracts   Contract[]
}

model Contract {
  id             Int       @id @default(autoincrement())
  startDate      DateTime
  endDate        DateTime?
  deposit        Float
  price          Float     // Giá thuê chốt tại thời điểm ký
  isActive       Boolean   @default(true)
  
  roomId         Int
  room           Room      @relation(fields: [roomId], references: [id])
  
  tenantId       Int
  tenant         Tenant    @relation(fields: [tenantId], references: [id])
  
  invoices       Invoice[]
}

model ServiceReading {
  id          Int      @id @default(autoincrement())
  roomId      Int
  month       DateTime // Ngày đầu tháng (VD: 2025-11-01)
  readings    Json     // { "dien": { "old": 100, "new": 150 }, ... }
  totalAmount Float
}

model Invoice {
  id          Int           @id @default(autoincrement())
  month       DateTime
  amount      Float
  paidAmount  Float         @default(0)
  status      InvoiceStatus @default(UNPAID)
  details     Json          // Snapshot chi tiết giá tiền lúc tính
  
  contractId  Int
  contract    Contract      @relation(fields: [contractId], references: [id])
  createdAt   DateTime      @default(now())
}

enum InvoiceStatus {
  UNPAID
  PARTIAL
  PAID
}

model Issue {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  status      String   @default("OPEN")
  roomId      Int
  room        Room     @relation(fields: [roomId], references: [id])
  createdAt   DateTime @default(now())
}
```

---

## 5. Development Strategy (Quy tắc cho AI Assistant)

**Nguyên tắc chung:**

* **Backend First (NestJS + Claude Model):** Luôn ưu tiên viết Logic API trước.
* **Bắt buộc:** Tạo DTO (ví dụ: `CreateBuildingDto`, `UpdateRoomDto`) và dùng `class-validator` để validate dữ liệu đầu vào.
* **Sau khi viết Controller:** Thêm Swagger Decorators (`@ApiTags`, `@ApiOperation`) để sinh tài liệu API.

**Frontend Follows (Next.js/Expo + Gemini Model):**

* Chỉ bắt đầu code UI khi API (DTO + routes) đã rõ ràng.
* Dùng **Ant Design** (Web) và **React Native Paper** (Mobile) để dựng UI nhanh.
* Dùng **axios** để gọi API từ frontend.

**Security & Quality:**

* Luôn validate dữ liệu nhạy cảm (Tiền nong, chỉ số điện nước).
* Không hard-code password/secret key (sử dụng `.env`).

---

## 5. Ghi chú / Checklist nhanh

* [ ] Backend: Prisma schema + Migrations
* [ ] Backend: DTOs + Controllers + Services (class-validator + Swagger)
* [ ] Billing Engine: Implement validation cho chỉ số và logic tính tiền
* [ ] Mobile: Chốt chỉ số (offline-capable), upload ảnh, sync
* [ ] Web Admin: Dashboard quản lý tòa nhà, phòng, hợp đồng, hóa đơn, ticket
* [ ] Security: JWT Auth, input sanitization, rate-limiting nếu cần
* [ ] Testing: Unit tests cho Billing Engine và các validation quan trọng

---

