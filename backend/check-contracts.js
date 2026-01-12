const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activeContracts = await prisma.contract.findMany({
    where: { isActive: true },
    include: { room: true },
  });

  console.log('--- ACTIVE CONTRACTS ---');
  activeContracts.forEach((c) => {
    console.log(
      `Contract ID: ${c.id}, Room: ${c.room.name}, BuildingID: ${c.room.buildingId}`,
    );
  });
  console.log('------------------------');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
