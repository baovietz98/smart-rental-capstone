import { PrismaClient, RoomStatus, ServiceType, CalculationType, InvoiceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // 1. Create Buildings
    let buildingA = await prisma.building.findFirst({ where: { name: 'Sunrise Apartment' } });
    if (!buildingA) {
        buildingA = await prisma.building.create({
            data: {
                name: 'Sunrise Apartment',
                address: '123 Le Van Sy, District 3, HCMC',
            },
        });
    }

    let buildingB = await prisma.building.findFirst({ where: { name: 'Green Valley' } });
    if (!buildingB) {
        buildingB = await prisma.building.create({
            data: {
                name: 'Green Valley',
                address: '456 Nguyen Van Linh, District 7, HCMC',
            },
        });
    }

    console.log(`Created buildings: ${buildingA.name}, ${buildingB.name}`);

    // 2. Create Services
    const services = [
        { name: 'Điện', price: 3500, unit: 'kWh', type: ServiceType.INDEX, calculationType: CalculationType.PER_USAGE },
        { name: 'Nước', price: 20000, unit: 'm3', type: ServiceType.INDEX, calculationType: CalculationType.PER_USAGE },
        { name: 'Internet', price: 100000, unit: 'tháng', type: ServiceType.FIXED, calculationType: CalculationType.PER_ROOM },
        { name: 'Rác', price: 20000, unit: 'tháng', type: ServiceType.FIXED, calculationType: CalculationType.PER_ROOM },
    ];

    for (const service of services) {
        const existing = await prisma.service.findFirst({ where: { name: service.name } });
        if (!existing) {
            await prisma.service.create({ data: service });
        }
    }
    console.log('Created services');

    // 3. Create Rooms for Building A
    const roomsA = [
        { name: '101', price: 5000000, floor: 1, area: 30, maxTenants: 2 },
        { name: '102', price: 5500000, floor: 1, area: 35, maxTenants: 3 },
        { name: '201', price: 5000000, floor: 2, area: 30, maxTenants: 2 },
        { name: '202', price: 5200000, floor: 2, area: 32, maxTenants: 2 },
    ];

    for (const room of roomsA) {
        const existing = await prisma.room.findFirst({ where: { name: room.name, buildingId: buildingA.id } });
        if (!existing) {
            await prisma.room.create({
                data: {
                    ...room,
                    buildingId: buildingA.id,
                    status: RoomStatus.AVAILABLE,
                },
            });
        }
    }

    // 4. Create Rooms for Building B
    const roomsB = [
        { name: 'B.101', price: 4000000, floor: 1, area: 25, maxTenants: 2 },
        { name: 'B.102', price: 4000000, floor: 1, area: 25, maxTenants: 2 },
    ];

    for (const room of roomsB) {
        const existing = await prisma.room.findFirst({ where: { name: room.name, buildingId: buildingB.id } });
        if (!existing) {
            await prisma.room.create({
                data: {
                    ...room,
                    buildingId: buildingB.id,
                    status: RoomStatus.AVAILABLE,
                },
            });
        }
    }
    console.log('Created rooms');

    // 5. Create Tenant & Contract for Room 101 (RENTED)
    let tenant1 = await prisma.tenant.findUnique({ where: { phone: '0909000111' } });
    if (!tenant1) {
        tenant1 = await prisma.tenant.create({
            data: {
                fullName: 'Nguyen Van A',
                phone: '0909000111',
                cccd: '079090000111',
            },
        });
    }

    const room101 = await prisma.room.findFirst({ where: { name: '101', buildingId: buildingA.id } });

    if (room101) {
        // Check if contract exists
        const existingContract = await prisma.contract.findFirst({
            where: { roomId: room101.id, tenantId: tenant1.id, isActive: true }
        });

        if (!existingContract) {
            // Update Room Status
            await prisma.room.update({
                where: { id: room101.id },
                data: { status: RoomStatus.RENTED },
            });

            // Create Contract
            const contract = await prisma.contract.create({
                data: {
                    roomId: room101.id,
                    tenantId: tenant1.id,
                    startDate: new Date('2025-01-01'),
                    endDate: new Date('2026-01-01'),
                    price: room101.price,
                    deposit: room101.price,
                    isActive: true,
                    initialIndexes: { 'Điện': 100, 'Nước': 10 },
                },
            });

            console.log(`Created contract for Room 101 with Tenant ${tenant1.fullName}`);

            // Create Invoice for current month
            await prisma.invoice.create({
                data: {
                    month: '12-2025',
                    contractId: contract.id,
                    status: InvoiceStatus.PAID,
                    roomCharge: room101.price,
                    serviceCharge: 500000,
                    totalAmount: room101.price + 500000,
                    paidAmount: room101.price + 500000,
                    debtAmount: 0,
                    lineItems: [
                        {
                            type: 'RENT',
                            name: 'Tiền phòng',
                            quantity: 1,
                            unit: 'tháng',
                            unitPrice: room101.price,
                            amount: room101.price
                        },
                        {
                            type: 'FIXED',
                            name: 'Dịch vụ',
                            quantity: 1,
                            unit: 'tháng',
                            unitPrice: 500000,
                            amount: 500000
                        }
                    ],
                }
            });
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
