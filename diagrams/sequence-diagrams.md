# Sequence Diagrams - Smart Rental Management

> Copy code mermaid bên dưới vào https://mermaid.live để xem diagram

## 1. Đăng nhập hệ thống

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database

    Admin->>FE: Nhập email & password
    FE->>BE: POST /auth/login
    BE->>DB: Tìm user theo email
    DB-->>BE: User data
    BE->>BE: Verify password (bcrypt)
    alt Password đúng
        BE->>BE: Generate JWT tokens
        BE-->>FE: Access token + Refresh token
        FE->>FE: Lưu token vào localStorage
        FE-->>Admin: Chuyển đến Dashboard
    else Password sai
        BE-->>FE: 401 Unauthorized
        FE-->>Admin: Hiển thị lỗi
    end
```

## 2. Tạo hợp đồng mới

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database

    Admin->>FE: Chọn phòng trống
    FE->>BE: GET /rooms?status=AVAILABLE
    BE->>DB: Query rooms
    DB-->>BE: Danh sách phòng trống
    BE-->>FE: Room list
    FE-->>Admin: Hiển thị form tạo hợp đồng

    Admin->>FE: Nhập thông tin khách thuê
    Admin->>FE: Nhập thông tin hợp đồng
    Admin->>FE: Nhập chỉ số điện nước đầu vào
    Admin->>FE: Submit

    FE->>BE: POST /contracts
    BE->>DB: Tạo/Cập nhật Tenant
    DB-->>BE: Tenant created
    BE->>DB: Tạo Contract
    DB-->>BE: Contract created
    BE->>DB: Cập nhật Room status = RENTED
    DB-->>BE: Room updated
    BE-->>FE: Contract details
    FE-->>Admin: Thông báo thành công
```

## 3. Ghi chỉ số điện nước

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database

    Admin->>FE: Vào trang ghi chỉ số
    FE->>BE: GET /contracts?isActive=true
    BE->>DB: Query active contracts
    DB-->>BE: Contract list với chỉ số cũ
    BE-->>FE: Danh sách hợp đồng
    FE-->>Admin: Hiển thị form ghi chỉ số

    Admin->>FE: Nhập chỉ số mới cho từng phòng
    Admin->>FE: Submit

    loop Mỗi contract
        FE->>BE: POST /service-readings
        BE->>BE: Tính usage = newIndex - oldIndex
        BE->>BE: Tính totalCost = usage × unitPrice
        BE->>DB: Lưu ServiceReading
        DB-->>BE: Reading saved
    end

    BE-->>FE: Success response
    FE-->>Admin: Thông báo đã ghi xong
```

## 4. Tạo hóa đơn hàng tháng

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database

    Admin->>FE: Chọn tháng tạo hóa đơn
    FE->>BE: GET /contracts?isActive=true
    BE->>DB: Query contracts
    DB-->>BE: Active contracts
    BE-->>FE: Contract list
    FE-->>Admin: Hiển thị danh sách

    Admin->>FE: Chọn contracts cần tạo hóa đơn
    Admin->>FE: Click "Tạo hóa đơn"

    FE->>BE: POST /invoices/generate

    loop Mỗi contract
        BE->>DB: Lấy thông tin Contract & Room
        DB-->>BE: Contract + Room data
        BE->>DB: Lấy ServiceReadings của tháng
        DB-->>BE: Readings data
        BE->>BE: Tính roomCharge = contract.price
        BE->>BE: Tính serviceCharge = sum(readings)
        BE->>BE: Tính totalAmount
        BE->>BE: Tạo lineItems JSON
        BE->>DB: Tạo Invoice (status=DRAFT)
        DB-->>BE: Invoice created
    end

    BE-->>FE: Invoices created
    FE-->>Admin: Hiển thị danh sách hóa đơn
```

## 5. Gửi hóa đơn cho khách

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    actor Tenant

    Admin->>FE: Chọn hóa đơn cần gửi
    Admin->>FE: Click "Gửi hóa đơn"

    FE->>BE: PATCH /invoices/:id/publish
    BE->>BE: Generate accessCode (UUID)
    BE->>DB: Update Invoice (status=PUBLISHED, publishedAt, accessCode)
    DB-->>BE: Invoice updated
    BE-->>FE: Invoice với link truy cập

    FE-->>Admin: Hiển thị link hóa đơn
    Admin->>Tenant: Gửi link qua Zalo/SMS

    Tenant->>FE: Mở link hóa đơn
    FE->>BE: GET /invoices/public/:accessCode
    BE->>DB: Tìm invoice theo accessCode
    DB-->>BE: Invoice data
    BE-->>FE: Invoice details
    FE-->>Tenant: Hiển thị chi tiết hóa đơn
```

## 6. Thanh toán hóa đơn

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database

    Admin->>FE: Chọn hóa đơn cần thanh toán
    FE->>BE: GET /invoices/:id
    BE->>DB: Query invoice
    DB-->>BE: Invoice data
    BE-->>FE: Invoice details
    FE-->>Admin: Hiển thị form thanh toán

    Admin->>FE: Nhập số tiền thanh toán
    Admin->>FE: Nhập ghi chú (chuyển khoản/tiền mặt)
    Admin->>FE: Submit

    FE->>BE: POST /transactions
    BE->>BE: Generate transaction code
    BE->>DB: Tạo Transaction
    DB-->>BE: Transaction created

    BE->>DB: Cập nhật Invoice.paidAmount
    BE->>BE: Tính debtAmount = totalAmount - paidAmount

    alt Thanh toán đủ
        BE->>DB: Update status = PAID
    else Thanh toán một phần
        BE->>DB: Update status = PARTIAL
    end

    DB-->>BE: Invoice updated
    BE-->>FE: Transaction + Invoice updated
    FE-->>Admin: Thông báo thành công
```

## 7. Báo sự cố

```mermaid
sequenceDiagram
    actor Tenant
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database
    actor Admin

    Tenant->>FE: Vào trang báo sự cố
    Tenant->>FE: Nhập tiêu đề & mô tả
    Tenant->>FE: Submit

    FE->>BE: POST /issues
    BE->>DB: Tạo Issue (status=OPEN)
    DB-->>BE: Issue created
    BE-->>FE: Issue details
    FE-->>Tenant: Thông báo đã gửi

    Note over Admin: Admin nhận thông báo

    Admin->>FE: Xem danh sách sự cố
    FE->>BE: GET /issues?status=OPEN
    BE->>DB: Query issues
    DB-->>BE: Issue list
    BE-->>FE: Issues
    FE-->>Admin: Hiển thị sự cố mới

    Admin->>FE: Cập nhật trạng thái xử lý
    FE->>BE: PATCH /issues/:id
    BE->>DB: Update status = IN_PROGRESS/RESOLVED
    DB-->>BE: Issue updated
    BE-->>FE: Updated issue
    FE-->>Admin: Thông báo cập nhật
```

## 8. Kết thúc hợp đồng

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant BE as Backend API
    participant DB as Database

    Admin->>FE: Chọn hợp đồng cần kết thúc
    FE->>BE: GET /contracts/:id
    BE->>DB: Query contract với invoices
    DB-->>BE: Contract + related data
    BE-->>FE: Contract details
    FE-->>Admin: Hiển thị thông tin

    Admin->>FE: Kiểm tra công nợ

    alt Còn nợ
        FE-->>Admin: Cảnh báo cần thanh toán
        Admin->>FE: Xác nhận thanh toán/bỏ qua
    end

    Admin->>FE: Click "Kết thúc hợp đồng"
    Admin->>FE: Nhập ngày kết thúc

    FE->>BE: PATCH /contracts/:id/terminate
    BE->>DB: Update Contract (isActive=false, endDate)
    DB-->>BE: Contract updated
    BE->>DB: Update Room (status=AVAILABLE)
    DB-->>BE: Room updated
    BE-->>FE: Success
    FE-->>Admin: Thông báo hoàn tất
```

## 9. Flow tổng quan hàng tháng

```mermaid
sequenceDiagram
    actor Admin
    participant System as Hệ thống
    participant Tenant

    Note over Admin,Tenant: Đầu tháng (ngày 1-5)

    Admin->>System: Ghi chỉ số điện nước
    System->>System: Lưu ServiceReadings

    Admin->>System: Tạo hóa đơn tháng
    System->>System: Tính toán & tạo Invoices

    Admin->>System: Kiểm tra & chỉnh sửa hóa đơn
    Admin->>System: Gửi hóa đơn

    System->>Tenant: Gửi link hóa đơn (Zalo/SMS)

    Note over Admin,Tenant: Trong tháng (ngày 5-25)

    Tenant->>System: Xem hóa đơn
    Tenant->>Admin: Thanh toán (chuyển khoản/tiền mặt)
    Admin->>System: Ghi nhận thanh toán

    Note over Admin,Tenant: Cuối tháng

    Admin->>System: Kiểm tra công nợ
    alt Có hóa đơn quá hạn
        System->>System: Đánh dấu OVERDUE
        Admin->>Tenant: Nhắc nhở thanh toán
    end
```
