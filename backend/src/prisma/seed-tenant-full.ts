import { PrismaClient, InvoiceStatus, CalculationType, UserRole, ServiceType, RoomStatus, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Clean up old data (optional, be careful)
  // await prisma.invoice.deleteMany();
  // await prisma.serviceReading.deleteMany();
  // await prisma.contract.deleteMany();

  // 2. Create Building
  const building = await prisma.building.create({
    data: {
      name: 'Skyline Tower',
      address: '123 Pham Van Dong, Hanoi',
    },
  });

  // 3. Create Services
  // Note: Service in this schema seems to be Global (no buildingId)
  const elecService = await prisma.service.create({
    data: {
      name: 'Điện sinh hoạt',
      unit: 'kWh',
      price: 3500,
      type: ServiceType.INDEX,
    },
  });

  const waterService = await prisma.service.create({
    data: {
      name: 'Nước sạch',
      unit: 'm3',
      price: 15000,
      type: ServiceType.INDEX,
    },
  });

  const wifiService = await prisma.service.create({
    data: {
      name: 'Internet High Speed',
      unit: 'tháng',
      price: 150000,
      type: ServiceType.FIXED,
      calculationType: CalculationType.PER_ROOM,
    },
  });
  
  const trashService = await prisma.service.create({
      data: {
        name: 'Vệ sinh rác',
        unit: 'người',
        price: 30000,
        type: ServiceType.FIXED,
        calculationType: CalculationType.PER_PERSON,
      },
    });

  // 4. Create Room
  const room = await prisma.room.create({
    data: {
      name: 'P101',
      price: 4500000,
      area: 35,
      buildingId: building.id,
      maxTenants: 2,
      status: RoomStatus.RENTED,
      gender: Gender.ALL,
    },
  });

  // 5. Create Tenant User
  const hashedPassword = await bcrypt.hash('123456', 10);
  const email = `demo.tenant.${Date.now()}@gmail.com`; // Unique email to avoid conflict
  const phone = `09${Math.floor(Math.random() * 100000000)}`;

  const user = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
      name: 'Nguyen Van A',
      role: UserRole.TENANT,
      phoneNumber: phone,
    },
  });
  
  const tenant = await prisma.tenant.create({
      data: {
          fullName: user.name,
          phone: user.phoneNumber || phone,
          cccd: '123456789012',
          userId: user.id, // Link generated User ID
      }
  });

  // 6. Create Contract
  const contract = await prisma.contract.create({
    data: {
      roomId: room.id,
      tenantId: tenant.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      price: room.price,
      deposit: 4500000,
      paymentDay: 5,
      isActive: true,
      numTenants: 2,
    },
  });

  // 7. Create Service Readings for Jan 2026
  const elecReading = await prisma.serviceReading.create({
    data: {
      contractId: contract.id,
      serviceId: elecService.id,
      month: '01-2026',
      oldIndex: 100,
      newIndex: 150, // Used 50 kWh
      usage: 50,
      unitPrice: elecService.price,
      totalCost: 50 * elecService.price, // 175,000
    },
  });

  const waterReading = await prisma.serviceReading.create({
    data: {
      contractId: contract.id,
      serviceId: waterService.id,
      month: '01-2026',
      oldIndex: 200,
      newIndex: 210, // Used 10 m3
      usage: 10,
      unitPrice: waterService.price,
      totalCost: 10 * waterService.price, // 150,000
    },
  });

  // 8. Generate Invoice with Line Items
  const invoiceLineItems = [
    {
      type: 'RENT',
      name: 'Tiền phòng T01/2026',
      quantity: 1,
      unit: 'tháng',
      unitPrice: room.price,
      amount: room.price,
    },
    {
      type: 'ELECTRIC',
      name: elecService.name,
      quantity: elecReading.usage,
      unit: elecService.unit,
      unitPrice: elecReading.unitPrice,
      amount: elecReading.totalCost,
      note: `Số cũ: ${elecReading.oldIndex}, Số mới: ${elecReading.newIndex}`,
      readingId: elecReading.id,
    },
    {
      type: 'WATER',
      name: waterService.name,
      quantity: waterReading.usage,
      unit: waterService.unit,
      unitPrice: waterReading.unitPrice,
      amount: waterReading.totalCost,
      note: `Số cũ: ${waterReading.oldIndex}, Số mới: ${waterReading.newIndex}`,
      readingId: waterReading.id,
    },
    {
      type: 'FIXED',
      name: wifiService.name,
      quantity: 1, // Per room
      unit: wifiService.unit,
      unitPrice: wifiService.price,
      amount: wifiService.price,
    },
    {
        type: 'FIXED',
        name: trashService.name,
        quantity: 2, // Per person (2 people)
        unit: trashService.unit,
        unitPrice: trashService.price,
        amount: trashService.price * 2,
      },
  ];

  const totalAmount = invoiceLineItems.reduce((sum, item) => sum + item.amount, 0);

  const invoice = await prisma.invoice.create({
    data: {
      contractId: contract.id,
      month: '01-2026',
      roomCharge: room.price,
      serviceCharge: totalAmount - room.price,
      extraCharge: 0,
       previousDebt: 0,
       discount: 0,
      totalAmount: totalAmount,
      debtAmount: totalAmount,
      paidAmount: 0,
      status: InvoiceStatus.PUBLISHED,
      lineItems: invoiceLineItems as any,
    },
  });

  // Mark readings as billed
  await prisma.serviceReading.updateMany({
      where: { id: { in: [elecReading.id, waterReading.id] } },
      data: { isBilled: true, invoiceId: invoice.id }
  });

  console.log(`✅ Seeded successfully!`);
  console.log(`User: demo.tenant@gmail.com / 123456`);
  console.log(`Invoice ID: ${invoice.id}, Total: ${totalAmount.toLocaleString()} VNĐ`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
