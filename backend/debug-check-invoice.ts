
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function checkInvoice() {
  console.log('Checking Invoice Data for T02/2026...');

  // 1. Check all invoices to see the month format
  const allInvoices = await prisma.invoice.findMany({ take: 5, orderBy: { id: 'desc' } });
  console.log('--- Latest Invoices ---');
  allInvoices.forEach(i => console.log(`ID: ${i.id}, Month: ${i.month}, Amount: ${i.totalAmount}, Status: ${i.status}`));

  // 2. Inspect Transaction 42
  const t42 = await prisma.transaction.findUnique({ where: { id: 42 } });
  if (t42) {
      console.log(`\n--- Transaction 42 ---`);
      console.log(`Code: ${t42.code}`);
      console.log(`Note: ${t42.note}`);
      console.log(`InvoiceID: ${t42.invoiceId}`);
      console.log(`ContractID: ${t42.contractId}`);
  }
}

checkInvoice()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
