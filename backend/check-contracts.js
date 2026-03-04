const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const contracts = await prisma.contract.findMany({
    include: { room: { include: { building: true } } },
  });
  console.log('Total contracts:', contracts.length);
  console.log('Active contracts:', contracts.filter((c) => c.isActive).length);
  contracts.forEach((c) => {
    console.log(
      `- ID: ${c.id} | Room: ${c.room?.name} | Active: ${c.isActive}`,
    );
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
