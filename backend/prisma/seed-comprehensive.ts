import { PrismaClient, RoomStatus, ServiceType, CalculationType, InvoiceStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING COMPREHENSIVE SEED (ALL CASES) ---');

    // 1. CLEANUP
    console.log('1. Cleaning up database...');
    // Delete in order to avoid Foreign Key constraints
    console.log('   Deleting data...');
    // Manual deletion order to be safe
    await prisma.notification.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.serviceReading.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.guestRequest.deleteMany();
    await prisma.issue.deleteMany(); 
    await prisma.tenant.deleteMany();
    await prisma.room.deleteMany();
    await prisma.service.deleteMany();
    await prisma.building.deleteMany();
    await prisma.user.deleteMany();

    console.log('   Data cleared.');

    // 2. PASSWORD HASH
    const password = await bcrypt.hash('123456', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // 3. CREATE ADMIN
    console.log('2. Creating Admin...');
    await prisma.user.create({
        data: {
            email: 'admin@demo.com',
            password: adminPassword,
            name: 'Super Admin',
            role: UserRole.ADMIN,
        }
    });

    // 4. INFRASTRUCTURE (Building, Services, Rooms)
    console.log('3. Creating Infrastructure...');
    const sunrise = await prisma.building.create({
        data: { name: 'Sunrise Apartment', address: '123 Le Van Sy, Q3, HCMC' }
    });

    const services = await Promise.all([
        prisma.service.create({ data: { name: 'Điện', price: 3500, unit: 'kWh', type: ServiceType.INDEX, calculationType: CalculationType.PER_USAGE } }),
        prisma.service.create({ data: { name: 'Nước', price: 20000, unit: 'm3', type: ServiceType.INDEX, calculationType: CalculationType.PER_USAGE } }),
        prisma.service.create({ data: { name: 'Internet', price: 100000, unit: 'tháng', type: ServiceType.FIXED, calculationType: CalculationType.PER_ROOM } }),
        prisma.service.create({ data: { name: 'Rác', price: 20000, unit: 'tháng', type: ServiceType.FIXED, calculationType: CalculationType.PER_ROOM } }),
        prisma.service.create({ data: { name: 'Gửi xe', price: 100000, unit: 'chiếc', type: ServiceType.FIXED, calculationType: CalculationType.PER_PERSON } }),
    ]);
    const [elec, water, net, trash, parking] = services;

    const rooms = await Promise.all([
        prisma.room.create({ data: { name: '101', price: 5000000, floor: 1, buildingId: sunrise.id, status: RoomStatus.RENTED, assets: ['Điều hòa', 'Tủ lạnh', 'Giường', 'Tủ quần áo'] } }),
        prisma.room.create({ data: { name: '102', price: 5500000, floor: 1, buildingId: sunrise.id, status: RoomStatus.RENTED, assets: ['Điều hòa', 'Nóng lạnh', 'Giường đôi'] } }),
        prisma.room.create({ data: { name: '103', price: 4500000, floor: 1, buildingId: sunrise.id, status: RoomStatus.RENTED, assets: ['Điều hòa', 'Tủ lạnh'] } }), // Expiring
        prisma.room.create({ data: { name: '104', price: 4000000, floor: 1, buildingId: sunrise.id, status: RoomStatus.AVAILABLE, assets: ['Điều hòa'] } }), // Empty
    ]);
    const [r101, r102, r103, r104] = rooms;

    // 5. TENANT 1: HAPPY PATH (Paid, No Issues)
    console.log('4. Creating Tenant 1 (Happy)...');
    const u1 = await prisma.user.create({
        data: { email: 'tenant1@demo.com', password, name: 'Nguyen Van Happy', role: UserRole.TENANT, phoneNumber: '0901111111' }
    });
    const t1 = await prisma.tenant.create({
        data: { fullName: 'Nguyen Van Happy', phone: '0901111111', cccd: '001', userId: u1.id }
    });
    const c1 = await prisma.contract.create({
        data: {
            roomId: r101.id, tenantId: t1.id, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'),
            price: r101.price, deposit: r101.price, isActive: true,
            initialIndexes: { [elec.id]: 100, [water.id]: 10 }
        }
    });
    // Invoice 1 (Paid)
    await prisma.invoice.create({
        data: {
            contractId: c1.id, month: '01-2026', status: InvoiceStatus.PAID,
            totalAmount: 5500000, paidAmount: 5500000, debtAmount: 0,
            roomCharge: 5000000, serviceCharge: 500000,
            lineItems: [
                { name: 'Tiền phòng T01/2026', amount: 5000000, quantity: 1, unit: 'tháng', unitPrice: 5000000, type: 'ROOM' },
                { name: 'Điện (CS cũ: 100 - CS mới: 150)', amount: 175000, quantity: 50, unit: 'kWh', unitPrice: 3500, type: 'SERVICE', note: 'Chỉ số cũ: 100 - Mới: 150' },
                { name: 'Nước (CS cũ: 10 - CS mới: 20)', amount: 200000, quantity: 10, unit: 'm3', unitPrice: 20000, type: 'SERVICE', note: 'Chỉ số cũ: 10 - Mới: 20' },
                { name: 'Rác, Internet, Dịch vụ khác', amount: 125000, quantity: 1, unit: 'gói', unitPrice: 125000, type: 'SERVICE' }
            ]
        }
    });

    // 6. TENANT 2: ISSUES & OVERDUE (The Problem Tenant)
    console.log('5. Creating Tenant 2 (Issues)...');
    const u2 = await prisma.user.create({
        data: { email: 'tenant2@demo.com', password, name: 'Tran Van Issue', role: UserRole.TENANT, phoneNumber: '0902222222' }
    });
    const t2 = await prisma.tenant.create({
        data: { fullName: 'Tran Van Issue', phone: '0902222222', cccd: '002', userId: u2.id }
    });
    const c2 = await prisma.contract.create({
        data: {
            roomId: r102.id, tenantId: t2.id, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'),
            price: r102.price, deposit: r102.price, isActive: true,
            initialIndexes: { [elec.id]: 500, [water.id]: 50 }
        }
    });
    // Invoice 1 (Overdue)
    await prisma.invoice.create({
        data: {
            contractId: c2.id, month: '01-2026', status: InvoiceStatus.OVERDUE,
            totalAmount: 6000000, paidAmount: 0, debtAmount: 6000000,
            roomCharge: 5500000, serviceCharge: 500000,
            lineItems: [
                { name: 'Tiền phòng T01/2026', amount: 5500000, quantity: 1, unit: 'tháng', unitPrice: 5500000, type: 'ROOM' },
                { name: 'Điện (CS cũ: 500 - CS mới: 600)', amount: 350000, quantity: 100, unit: 'kWh', unitPrice: 3500, type: 'SERVICE', note: 'Chỉ số cũ: 500 - Mới: 600' },
                { name: 'Nước (CS cũ: 50 - CS mới: 55)', amount: 100000, quantity: 5, unit: 'm3', unitPrice: 20000, type: 'SERVICE', note: 'Chỉ số cũ: 50 - Mới: 55' },
                { name: 'Rác, Internet', amount: 50000, quantity: 1, unit: 'gói', unitPrice: 50000, type: 'SERVICE' }
            ], dueDate: new Date('2026-01-10')
        }
    });
    // Open Issue
    await prisma.issue.create({
        data: {
            roomId: r102.id, title: 'Hỏng máy lạnh', description: 'Máy lạnh chảy nước', status: 'OPEN', priority: 'HIGH',
            createdAt: new Date()
        }
    });
    // Notification for Tenant 2
    await prisma.notification.create({
        data: {
            title: 'Nhắc nhở đóng tiền', content: 'Bạn có hóa đơn quá hạn T1/2026. Vui lòng thanh toán gấp.', type: 'PAYMENT', tenantId: t2.id
        }
    });

    // 7. TENANT 3: EXPIRING / EDGE CASE
    console.log('6. Creating Tenant 3 (Expiring)...');
    const u3 = await prisma.user.create({
        data: { email: 'tenant3@demo.com', password, name: 'Le Thi Edge', role: UserRole.TENANT, phoneNumber: '0903333333' }
    });
    const t3 = await prisma.tenant.create({
        data: { fullName: 'Le Thi Edge', phone: '0903333333', cccd: '003', userId: u3.id }
    });
    const c3 = await prisma.contract.create({
        data: {
            roomId: r103.id, tenantId: t3.id, startDate: new Date('2025-08-01'), 
            endDate: new Date('2026-02-10'), // Expiring in a few days relative to "Now" (Assuming Feb 2026 context)
            price: r103.price, deposit: r103.price, isActive: true,
            initialIndexes: { [elec.id]: 1000, [water.id]: 100 }
        }
    });
    // Invoice (Just published/Unpaid)
    await prisma.invoice.create({
        data: {
            contractId: c3.id, month: '02-2026', status: InvoiceStatus.PUBLISHED,
            totalAmount: 4800000, paidAmount: 0, debtAmount: 4800000,
            roomCharge: 4500000, serviceCharge: 300000,
            lineItems: [], dueDate: new Date('2026-02-15')
        }
    });

    // 8. GENERAL NOTIFICATIONS
    await prisma.notification.createMany({
        data: [
            { title: 'Bảo trì thang máy', content: 'Thang máy sẽ bảo trì từ 8h-12h ngày 05/02.', type: 'GENERAL' },
            { title: 'Chúc mừng năm mới', content: 'Ban quản lý chúc mừng năm mới 2026!', type: 'GENERAL' }
        ]
    });

    // ---------------------------------------------------------
    // NEW BUILDING: LANDMARK TOWER (VIP & Cases)
    // ---------------------------------------------------------
    console.log('7. Creating Landmark Tower...');
    const landmark = await prisma.building.create({
        data: { name: 'Landmark Tower', address: '99 Nguyen Hue, Q1, HCMC' }
    });
    
    // Rooms
    const rL01 = await prisma.room.create({ data: { name: 'L.01', price: 10000000, floor: 1, buildingId: landmark.id, status: RoomStatus.RENTED, assets: ['TV 65"', 'Sofa', 'Bếp từ'] } });
    const rL02 = await prisma.room.create({ data: { name: 'L.02', price: 8000000, floor: 1, buildingId: landmark.id, status: RoomStatus.RENTED, assets: ['TV 50"', 'Tủ lạnh'] } });
    const rL03 = await prisma.room.create({ data: { name: 'L.03', price: 8000000, floor: 1, buildingId: landmark.id, status: RoomStatus.MAINTENANCE, assets: [] } }); // Maintenance
    const rL04 = await prisma.room.create({ data: { name: 'L.04', price: 8000000, floor: 1, buildingId: landmark.id, status: RoomStatus.AVAILABLE, assets: [] } });

    // Tenant 4: VIP (Richie Rich)
    const u4 = await prisma.user.create({ data: { email: 'vip@demo.com', password, name: 'Pham Van VIP', role: UserRole.TENANT, phoneNumber: '0908888888' } });
    const t4 = await prisma.tenant.create({ data: { fullName: 'Pham Van VIP', phone: '0908888888', cccd: '004', userId: u4.id } });
    const c4 = await prisma.contract.create({
        data: {
            roomId: rL01.id, tenantId: t4.id, startDate: new Date('2025-06-01'), endDate: new Date('2026-06-01'),
            price: rL01.price, deposit: rL01.price, isActive: true,
            initialIndexes: { [elec.id]: 2000, [water.id]: 200 }
        }
    });
    // Invoice VIP match FE requirements (Detailed)
    await prisma.invoice.create({
        data: {
            contractId: c4.id, month: '01-2026', status: InvoiceStatus.PAID,
            // Room 10tr + Elec 1tr + Water 400k + Service 500k = 11.9tr
            roomCharge: 10000000, serviceCharge: 1900000, totalAmount: 11900000, paidAmount: 11900000, debtAmount: 0,
            lineItems: [
                { name: 'Tiền phòng T01/2026 (VIP)', amount: 10000000, quantity: 1, unit: 'tháng', unitPrice: 10000000, type: 'ROOM' },
                { name: 'Điện (CS cũ: 2000 - CS mới: 2300)', amount: 1050000, quantity: 300, unit: 'kWh', unitPrice: 3500, type: 'SERVICE', note: 'Chỉ số cũ: 2000 - Mới: 2300' },
                { name: 'Nước (CS cũ: 200 - CS mới: 220)', amount: 400000, quantity: 20, unit: 'm3', unitPrice: 20000, type: 'SERVICE', note: 'Chỉ số cũ: 200 - Mới: 220' },
                { name: 'Phí quản lý & Gym/Pool', amount: 450000, quantity: 1, unit: 'gói', unitPrice: 450000, type: 'SERVICE' }
            ]
        }
    });

    // Tenant 5: Newbie (Just moved in, partial payment)
    const u5 = await prisma.user.create({ data: { email: 'newbie@demo.com', password, name: 'Le Van Moi', role: UserRole.TENANT, phoneNumber: '0909999999' } });
    const t5 = await prisma.tenant.create({ data: { fullName: 'Le Van Moi', phone: '0909999999', cccd: '005', userId: u5.id } });
    const c5 = await prisma.contract.create({
        data: {
            roomId: rL02.id, tenantId: t5.id, startDate: new Date('2026-01-15'), endDate: new Date('2027-01-15'),
            price: rL02.price, deposit: rL02.price, isActive: true,
            initialIndexes: { [elec.id]: 0, [water.id]: 0 }
        }
    });
    // Partial Invoice (Half month room + services)
    await prisma.invoice.create({
        data: {
            contractId: c5.id, month: '01-2026', status: InvoiceStatus.PARTIAL,
            // Half room (4tr) + Deposit (8tr) + Service (200k) = 12.2tr
            // User paid Deposit (8tr) + Room (4tr) = 12tr, owes 200k service
            roomCharge: 4000000, serviceCharge: 200000, totalAmount: 4200000, paidAmount: 4000000, debtAmount: 200000,
            lineItems: [
                { name: 'Tiền phòng T01/2026 (15 ngày)', amount: 4000000, quantity: 0.5, unit: 'tháng', unitPrice: 8000000, type: 'ROOM', note: 'Vào ở từ 15/01' },
                { name: 'Điện (CS cũ: 0 - CS mới: 30)', amount: 105000, quantity: 30, unit: 'kWh', unitPrice: 3500, type: 'SERVICE' },
                { name: 'Nước (CS cũ: 0 - CS mới: 3)', amount: 60000, quantity: 3, unit: 'm3', unitPrice: 20000, type: 'SERVICE' },
                { name: 'Rác', amount: 35000, quantity: 1, unit: 'tháng', unitPrice: 35000, type: 'SERVICE' }
            ], dueDate: new Date('2026-01-20')
        }
    });

    // Issue for Maintenance Room
    await prisma.issue.create({
        data: {
            roomId: rL03.id, title: 'Thấm trần nhà vệ sinh', description: 'Nước nhỏ giọt từ tầng trên xuống.', status: 'IN_PROGRESS', createdAt: new Date()
        }
    });

    // 9. TRANSACTIONS (Finance Data)
    console.log('8. Creating transactions for finance page...');
    
    // Deposits when tenants moved in
    await prisma.transaction.create({
        data: {
            code: 'PT-0001',
            amount: 5000000,
            type: 'DEPOSIT',
            date: new Date('2026-01-01'),
            note: 'Tiềncọc phòng 101 - Nguyen Van Happy',
            contractId: c1.id
        }
    });

    await prisma.transaction.create({
        data: {
            code: 'PT-0002',
            amount: 5500000,
            type: 'DEPOSIT',
            date: new Date('2026-01-01'),
            note: 'Tiền cọc phòng 102 - Tran Van Issue',
            contractId: c2.id
        }
    });

    await prisma.transaction.create({
        data: {
            code: 'PT-0003',
            amount: 4500000,
            type: 'DEPOSIT',
            date: new Date('2025-08-01'),
            note: 'Tiền cọc phòng 103 - Le Thi Edge',
            contractId: c3.id
        }
    });

    await prisma.transaction.create({
        data: {
            code: 'PT-0004',
            amount: 10000000,
            type: 'DEPOSIT',
            date: new Date('2025-06-01'),
            note: 'Tiền cọc phòng L.01 VIP - Pham Van VIP',
            contractId: c4.id
        }
    });

    await prisma.transaction.create({
        data: {
            code: 'PT-0005',
            amount: 8000000,
            type: 'DEPOSIT',
            date: new Date('2026-01-15'),
            note: 'Tiền cọc phòng L.02 - Le Van Moi',
            contractId: c5.id
        }
    });

    // Invoice payments (Tenant 1 paid, Tenant 4 VIP paid)
    await prisma.transaction.create({
        data: {
            code: 'PT-0006',
            amount: 5800000,
            type: 'INVOICE_PAYMENT',
            date: new Date('2026-01-05'),
            note: 'Thanh toán hóa đơn T01/2026 - Phòng 101',
            contractId: c1.id
        }
    });

    await prisma.transaction.create({
        data: {
            code: 'PT-0007',
            amount: 11900000,
            type: 'INVOICE_PAYMENT',
            date: new Date('2026-01-03'),
            note: 'Thanh toán hóa đơn T01/2026 (VIP) - Phòng L.01',
            contractId: c4.id
        }
    });

    await prisma.transaction.create({
        data: {
            code: 'PT-0008',
            amount: 4000000,
            type: 'INVOICE_PAYMENT',
            date: new Date('2026-01-18'),
            note: 'Thanh toán 1 phần hóa đơn T01/2026 - Phòng L.02',
            contractId: c5.id
        }
    });

    // Operating expenses
    await prisma.transaction.create({
        data: {
            code: 'PT-0009',
            amount: 500000,
            type: 'EXPENSE',
            date: new Date('2026-01-10'),
            note: 'Sửa chữa máy lạnh phòng 102',
            contractId: null
        }
    });

    await prisma.transaction.create({
        data: {
            code: 'PT-0010',
            amount: 800000,
            type: 'EXPENSE',
            date: new Date('2026-01-15'),
            note: 'Tiền điện chung khu tòa nhà - Tháng 01/2026',
            contractId: null
        }
    });

    await prisma.transaction.create({
        data: {
            code: 'PT-0011',
            amount: 300000,
            type: 'EXPENSE',
            date: new Date('2026-01-20'),
            note: 'Vệ sinh định kỳ toàn bộ tòa nhà',
            contractId: null
        }
    });

    await prisma.transaction.create({
        data: {
            code: 'PT-0012',
            amount: 200000,
            type: 'EXPENSE',
            date: new Date('2026-01-25'),
            note: 'Mua bóng đèn và vật tư điện',
            contractId: null
        }
    });

    console.log('--- SEEDING COMPLETED ---');
    console.log('Admin:    admin@demo.com / admin123');
    console.log('Tenant 1: tenant1@demo.com / 123456 (Happy)');
    console.log('Tenant 2: tenant2@demo.com / 123456 (Issues/Overdue)');
    console.log('Tenant 3: tenant3@demo.com / 123456 (Expiring/Pending)');
    console.log('Tenant 4: vip@demo.com     / 123456 (Landmark VIP)');
    console.log('Tenant 5: newbie@demo.com  / 123456 (Landmark New/Partial)');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
