import { PrismaClient, RoomStatus, ServiceType, CalculationType, InvoiceStatus, UserRole, ReadingSource, RequestStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING COMPREHENSIVE SEED ---');

    // 1. CLEANUP (Delete in order to avoid Foreign Key constraints)
    await prisma.transaction.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.serviceReading.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.guestRequest.deleteMany();
    await prisma.issue.deleteMany(); // Added Issues cleanup
    await prisma.tenant.deleteMany();
    await prisma.room.deleteMany();
    await prisma.service.deleteMany();
    await prisma.building.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('--- CLEANUP DONE ---');

    // 2. Create Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@demo.com',
            password: hashedPassword,
            name: 'Super Admin',
            role: UserRole.ADMIN,
        }
    });

    // 3. Create Buildings
    const buildings = await Promise.all([
        prisma.building.create({
            data: { name: 'Sunrise Apartment', address: '123 Le Van Sy, Q3, HCMC' }
        }),
        prisma.building.create({
            data: { name: 'Green Valley', address: '456 Nguyen Van Linh, Q7, HCMC' }
        })
    ]);
    const [sunrise, greenValley] = buildings;

    // 4. Create Services
    const services = await Promise.all([
        prisma.service.create({ data: { name: 'Điện', price: 3500, unit: 'kWh', type: ServiceType.INDEX, calculationType: CalculationType.PER_USAGE } }),
        prisma.service.create({ data: { name: 'Nước', price: 20000, unit: 'm3', type: ServiceType.INDEX, calculationType: CalculationType.PER_USAGE } }),
        prisma.service.create({ data: { name: 'Internet', price: 100000, unit: 'tháng', type: ServiceType.FIXED, calculationType: CalculationType.PER_ROOM } }),
        prisma.service.create({ data: { name: 'Rác', price: 20000, unit: 'tháng', type: ServiceType.FIXED, calculationType: CalculationType.PER_ROOM } }),
        prisma.service.create({ data: { name: 'Gửi xe', price: 100000, unit: 'chiếc', type: ServiceType.FIXED, calculationType: CalculationType.PER_PERSON } }),
    ]);
    const [elecService, waterService, netService] = services;

    // 5. Create Rooms (Sunrise: 101-104, Green: B1-B2)
    const roomsData = [
        { name: '101', price: 5000000, floor: 1, buildingId: sunrise.id, assets: { 'AirCond': 1, 'Fridge': 1 } },
        { name: '102', price: 5500000, floor: 1, buildingId: sunrise.id, assets: { 'AirCond': 1, 'Bed': 2 } },
        { name: '103', price: 5000000, floor: 1, buildingId: sunrise.id, status: RoomStatus.AVAILABLE },
        { name: 'B.01', price: 3500000, floor: 1, buildingId: greenValley.id, status: RoomStatus.AVAILABLE },
    ];

    const rooms = await Promise.all(roomsData.map(r => prisma.room.create({ data: r })));
    const [room101, room102] = rooms;

    // 6. Create Tenants & Linked Users
    // Tenant A: Has User Account (Pro features)
    const tenantUserPhone = '0901234567';
    const tenantUser = await prisma.user.create({
        data: {
            email: 'tenant.a@demo.com',
            phoneNumber: tenantUserPhone,
            password: hashedPassword, // 'admin123'
            name: 'Nguyen Van Tenant',
            role: UserRole.TENANT,
        }
    });

    const tenantA = await prisma.tenant.create({
        data: {
            fullName: 'Nguyen Van Tenant',
            phone: tenantUserPhone,
            cccd: '079123456789',
            userId: tenantUser.id, // Linked!
            vehicles: {
                create: [
                    { plateNumber: '59-A1 123.45', type: 'Motorbike', image: 'https://via.placeholder.com/150' }
                ]
            }
        }
    });

    // Tenant B: Traditional (No App Account)
    const tenantB = await prisma.tenant.create({
        data: {
            fullName: 'Tran Thi Traditional',
            phone: '0909888777', // No User linked
            cccd: '079988877766'
        }
    });

    console.log('--- Created Users & Tenants ---');

    // 7. Contracts
    // Contract A: Room 101, Active
    const contractA = await prisma.contract.create({
        data: {
            roomId: room101.id,
            tenantId: tenantA.id,
            startDate: new Date('2025-01-01'),
            endDate: new Date('2026-01-01'),
            price: room101.price,
            deposit: room101.price,
            initialIndexes: { 
                [elecService.id]: 100, 
                [waterService.id]: 10 
            },
            isActive: true, // Ensuring it is active
        }
    });
    // Update Room Status
    await prisma.room.update({ where: { id: room101.id }, data: { status: RoomStatus.RENTED } });

    // Contract B: Room 102, Active
    const contractB = await prisma.contract.create({
        data: {
            roomId: room102.id,
            tenantId: tenantB.id,
            startDate: new Date('2025-02-01'),
            price: room102.price,
            deposit: room102.price,
            initialIndexes: { 
                [elecService.id]: 500, 
                [waterService.id]: 50 
            },
            isActive: true,
        }
    });
    await prisma.room.update({ where: { id: room102.id }, data: { status: RoomStatus.RENTED } });

    // 8. Service Readings (Last Month - Admin Confirmed)
    // 8. Service Readings (Last Month - Admin Confirmed)
    // REMOVED TO ALLOW USER TESTING
    /*
    await prisma.serviceReading.create({
        data: {
            contractId: contractA.id,
            serviceId: elecService.id,
            month: '01-2026',
            oldIndex: 100,
            newIndex: 150, // Used 50
            usage: 50,
            unitPrice: elecService.price,
            totalCost: 50 * elecService.price,
            isConfirmed: true,
            type: ReadingSource.ADMIN
        }
    });

    // 9. Service Readings (This Month - Tenant Submitted / Self-Service)
    // Tenant A submits reading for Feb
    await prisma.serviceReading.create({
        data: {
            contractId: contractA.id,
            serviceId: elecService.id,
            month: '02-2026', // Current/Next month
            oldIndex: 150,
            newIndex: 180, 
            usage: 30,
            unitPrice: elecService.price,
            totalCost: 30 * elecService.price,
            isConfirmed: false, // Pending Admin Approval
            type: ReadingSource.TENANT,
            imageUrls: ['https://via.placeholder.com/200?text=Meter+Photo']
        }
    });
    */

    // 10. Invoices
    // Invoice 1: Jan 2026 (Paid)
    await prisma.invoice.create({
        data: {
            contractId: contractA.id,
            month: '01-2026',
            status: InvoiceStatus.PAID,
            roomCharge: room101.price,
            serviceCharge: 200000,
            totalAmount: room101.price + 200000,
            paidAmount: room101.price + 200000,
            debtAmount: 0,
            lineItems: [],
            updatedAt: new Date('2026-01-05')
        }
    });

    // Invoice 2: Feb 2026 (Draft/Unpaid)
    await prisma.invoice.create({
        data: {
            contractId: contractA.id,
            month: '02-2026',
            status: InvoiceStatus.PUBLISHED, // Sent to tenant
            roomCharge: room101.price,
            serviceCharge: 0, // Not calculated yet
            totalAmount: room101.price,
            paidAmount: 0,
            debtAmount: room101.price,
            lineItems: [],
            dueDate: new Date('2026-02-10')
        }
    });

    // 11. Issues Reporting (Requested specifically by User)
    await prisma.issue.create({
        data: {
            roomId: room101.id,
            title: 'Hỏng máy lạnh',
            description: 'Máy lạnh không ra hơi lạnh, chỉ có gió.',
            status: 'OPEN',
            createdAt: new Date('2026-02-01T10:00:00Z')
        }
    });
    
    await prisma.issue.create({
        data: {
            roomId: room101.id,
            title: 'Bóng đèn nhà vệ sinh nhấp nháy',
            description: 'Cần thay bóng đèn mới.',
            status: 'DONE', // Completed
            createdAt: new Date('2026-01-15T09:00:00Z')
        }
    });

    // 12. Guest Requests
    await prisma.guestRequest.create({
        data: {
            tenantId: tenantA.id,
            guestName: 'Nguyen Van Ban',
            startDate: new Date('2026-02-10'),
            endDate: new Date('2026-02-12'),
            status: RequestStatus.PENDING
        }
    });

    console.log('--- SEEDING COMPLETED WITH FULL DATA (ISSUES, GUESTS, READINGS) ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
