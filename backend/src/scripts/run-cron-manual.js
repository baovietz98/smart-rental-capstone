const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const res = await prisma.invoice.updateMany({
    where: {
      status: { in: ['PUBLISHED', 'PARTIAL'] },
      debtAmount: { gt: 0 },
      dueDate: { lt: now },
    },
    data: { status: 'OVERDUE' },
  });
  console.log('Updated ' + res.count + ' invoices to OVERDUE.');
}

main().finally(() => prisma.$disconnect());
