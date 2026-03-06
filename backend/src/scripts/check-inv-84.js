const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const inv = await prisma.invoice.findFirst({
    where: { id: 84 },
    select: { id: true, status: true, dueDate: true, month: true },
  });
  console.log(inv);
}
main().finally(() => prisma.$disconnect());
