const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugData() {
  const month = '12-2025';
  console.log(`--- DEBUGGING DATA FOR ${month} ---`);

  // 1. Invoices
  const invoices = await prisma.invoice.findMany({
    where: { month },
    include: {
      contract: {
        include: {
          room: true,
        },
      },
    },
  });

  console.log('Total Invoices Found:', invoices.length);
  const stats = {
    totalAmount: 0,
    totalPaid: 0,
    totalDebt: 0,
  };

  invoices.forEach((inv) => {
    stats.totalAmount += inv.totalAmount;
    stats.totalPaid += inv.paidAmount;
    stats.totalDebt += inv.debtAmount;
    console.log(
      `Invoice ID: ${inv.id}, Room: ${inv.contract.room.name}, Status: ${inv.status}, Total: ${inv.totalAmount}, Paid: ${inv.paidAmount}, Debt: ${inv.debtAmount}`,
    );
  });

  console.log('Aggregated Stats:', stats);

  // 2. Contracts
  const activeContracts = await prisma.contract.count({
    where: { isActive: true },
  });
  const totalRooms = await prisma.room.count();
  console.log('Active Contracts:', activeContracts);
  console.log('Total Rooms:', totalRooms);

  // 3. Transactions
  const recentTransactions = await prisma.transaction.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      contract: {
        include: { room: true },
      },
    },
  });
  console.log('Recent Transactions:', recentTransactions.length);

  console.log('--- END DEBUG ---');
}

debugData()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
