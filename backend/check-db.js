const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const buildingCount = await prisma.building.count();
  const roomCount = await prisma.room.count();
  const contractCount = await prisma.contract.count({
    where: { isActive: true },
  });
  const invoiceCount = await prisma.invoice.count();
  const latestInvoices = await prisma.invoice.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { month: true, status: true, totalAmount: true },
  });
  const transactionCount = await prisma.transaction.count();
  const issueCount = await prisma.issue.count();

  console.log('--- DB SUMMARY ---');
  console.log('Buildings:', buildingCount);
  console.log('Rooms:', roomCount);
  console.log('Active Contracts:', contractCount);
  console.log('Total Invoices:', invoiceCount);
  console.log('Latest Invoices:', JSON.stringify(latestInvoices, null, 2));
  console.log('Total Transactions:', transactionCount);
  console.log('Total Issues:', issueCount);
  console.log('------------------');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
