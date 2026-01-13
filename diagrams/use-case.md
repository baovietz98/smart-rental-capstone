# Use Case Diagram - Smart Rental Management

> Copy code mermaid bên dưới vào https://mermaid.live để xem diagram

## Tổng quan hệ thống

```mermaid
flowchart LR
    subgraph Actors
        Admin((Admin\nChủ trọ))
        Tenant((Tenant\nKhách thuê))
    end

    subgraph UC_Building[Quản lý Tòa nhà/Phòng]
        UC1[Quản lý tòa nhà]
        UC2[Quản lý phòng]
        UC3[Xem danh sách phòng trống]
    end

    subgraph UC_Tenant[Quản lý Khách thuê]
        UC4[Thêm khách thuê mới]
        UC5[Cập nhật thông tin khách]
        UC6[Xem danh sách khách thuê]
    end

    subgraph UC_Contract[Quản lý Hợp đồng]
        UC7[Tạo hợp đồng mới]
        UC8[Gia hạn hợp đồng]
        UC9[Kết thúc hợp đồng]
        UC10[Xem chi tiết hợp đồng]
    end

    subgraph UC_Service[Quản lý Dịch vụ]
        UC11[Quản lý dịch vụ]
        UC12[Ghi chỉ số điện nước]
        UC13[Xem lịch sử chỉ số]
    end

    subgraph UC_Invoice[Quản lý Hóa đơn]
        UC14[Tạo hóa đơn]
        UC15[Gửi hóa đơn cho khách]
        UC16[Xem hóa đơn]
        UC17[Thanh toán hóa đơn]
    end

    subgraph UC_Issue[Quản lý Sự cố]
        UC18[Báo sự cố]
        UC19[Xử lý sự cố]
        UC20[Xem danh sách sự cố]
    end

    %% Admin connections
    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16
    Admin --> UC17
    Admin --> UC19
    Admin --> UC20

    %% Tenant connections
    Tenant --> UC16
    Tenant --> UC17
    Tenant --> UC18
    Tenant --> UC10
```

## Chi tiết Use Cases theo Actor

### Admin (Chủ trọ)

```mermaid
flowchart TB
    Admin((Admin))

    Admin --> A1[Đăng nhập/Đăng xuất]
    Admin --> A2[Quản lý tòa nhà]
    Admin --> A3[Quản lý phòng]
    Admin --> A4[Quản lý khách thuê]
    Admin --> A5[Quản lý hợp đồng]
    Admin --> A6[Quản lý dịch vụ]
    Admin --> A7[Ghi chỉ số điện nước]
    Admin --> A8[Tạo & gửi hóa đơn]
    Admin --> A9[Ghi nhận thanh toán]
    Admin --> A10[Xử lý sự cố]
    Admin --> A11[Xem báo cáo thống kê]

    A2 --> A2a[Thêm tòa nhà]
    A2 --> A2b[Sửa tòa nhà]
    A2 --> A2c[Xóa tòa nhà]

    A3 --> A3a[Thêm phòng]
    A3 --> A3b[Sửa thông tin phòng]
    A3 --> A3c[Xóa phòng]
    A3 --> A3d[Cập nhật trạng thái]

    A5 --> A5a[Tạo hợp đồng]
    A5 --> A5b[Gia hạn hợp đồng]
    A5 --> A5c[Kết thúc hợp đồng]

    A8 --> A8a[Tạo hóa đơn tự động]
    A8 --> A8b[Chỉnh sửa hóa đơn]
    A8 --> A8c[Gửi hóa đơn qua link]
```

### Tenant (Khách thuê)

```mermaid
flowchart TB
    Tenant((Tenant))

    Tenant --> T1[Xem hóa đơn qua link]
    Tenant --> T2[Thanh toán hóa đơn]
    Tenant --> T3[Báo sự cố/bảo trì]
    Tenant --> T4[Xem thông tin hợp đồng]
    Tenant --> T5[Xem lịch sử thanh toán]
```
