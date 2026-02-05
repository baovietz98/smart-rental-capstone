const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Invoices ---');
  const invoices = await prisma.invoice.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      contract: {
        include: {
          room: true,
          tenant: true,
        },
      },
    },
  });
  console.log(`Found ${invoices.length} recent invoices.`);
  invoices.forEach((inv) => {
    console.log(
      `ID: ${inv.id}, Month: ${inv.month}, Total: ${inv.totalAmount}, Paid: ${inv.paidAmount}, Status: ${inv.status}`,
    );
  });

  console.log('\n--- Checking Transactions ---');
  const transactions = await prisma.transaction.findMany({
    take: 10,
    orderBy: { date: 'desc' },
  });
  console.log(`Found ${transactions.length} recent transactions.`);
  transactions.forEach((tx) => {
    console.log(
      `ID: ${tx.id}, Date: ${tx.date}, Amount: ${tx.amount}, Type: ${tx.type}`,
    );
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
