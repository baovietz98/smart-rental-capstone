import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLineItems() {
  console.log('Checking invoices...');

  const invoices = await prisma.invoice.findMany({
    take: 5,
    include: {
      contract: {
        include: {
          room: true,
          tenant: true,
        },
      },
    },
  });

  console.log(`Found ${invoices.length} invoices`);

  for (const inv of invoices) {
    console.log(`\nInvoice ID: ${inv.id}, Month: ${inv.month}`);
    console.log('Current lineItems:', inv.lineItems);
    console.log('Type:', typeof inv.lineItems);
    console.log('Is Array:', Array.isArray(inv.lineItems));

    // Update with sample lineItems if empty
    if (
      !inv.lineItems ||
      (Array.isArray(inv.lineItems) && inv.lineItems.length === 0)
    ) {
      console.log('  → Updating with sample lineItems...');

      const sampleLineItems = [
        {
          name: `Tiền phòng ${inv.month}`,
          amount: inv.totalAmount * 0.8,
          quantity: 1,
          unit: 'tháng',
          unitPrice: inv.totalAmount * 0.8,
          type: 'ROOM',
        },
        {
          name: 'Điện (CS cũ: 0 - CS mới: 30)',
          amount: 105000,
          quantity: 30,
          unit: 'kWh',
          unitPrice: 3500,
          type: 'SERVICE',
        },
        {
          name: 'Nước (CS cũ: 0 - CS mới: 5)',
          amount: 100000,
          quantity: 5,
          unit: 'm³',
          unitPrice: 20000,
          type: 'SERVICE',
        },
      ];

      await prisma.invoice.update({
        where: { id: inv.id },
        data: {
          lineItems: sampleLineItems,
        },
      });

      console.log('  ✓ Updated!');
    } else {
      console.log('  → Already has lineItems');
    }
  }

  console.log('\n✓ Done!');
  await prisma.$disconnect();
}

fixLineItems().catch((e) => {
  console.error(e);
  process.exit(1);
});
