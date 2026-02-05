import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const invoiceCount = await prisma.invoice.count();
  const paidInvoiceCount = await prisma.invoice.count({
    where: { status: 'PAID' },
  });
  const transactionCount = await prisma.transaction.count();

  console.log('--- DATA CHECK ---');
  console.log(`Total Invoices: ${invoiceCount}`);
  console.log(`Paid Invoices: ${paidInvoiceCount}`);
  console.log(`Total Transactions: ${transactionCount}`);

  // Check if we need to backfill
  if (paidInvoiceCount > 0 && transactionCount === 0) {
    console.log('! DETECTED MISSING TRANSACTIONS FOR PAID INVOICES !');
    console.log('Creating backfill...');

    const paidInvoices = await prisma.invoice.findMany({
      where: { status: 'PAID' },
      include: { contract: true },
    });

    for (const inv of paidInvoices) {
      console.log(`Backfilling for Invoice #${inv.id} - ${inv.totalAmount}`);
      await prisma.transaction.create({
        data: {
          code: `PT-BACKFILL-${inv.id}`,
          amount: inv.totalAmount,
          type: 'INVOICE_PAYMENT',
          date: inv.updatedAt, // Use invoice update time
          contractId: inv.contractId,
          invoiceId: inv.id,
          note: `Thanh toán hóa đơn tháng ${inv.month} (Backfill)`,
        },
      });
    }
    console.log('Backfill complete.');
  }

  // Also Generate some Random Expenses if none exist for demo purposes?
  // Maybe not "Real Data" means user data.
  // But if the user just seeded, they might want some noise.
  // Let's stick to backfilling actual invoice payments first.
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
