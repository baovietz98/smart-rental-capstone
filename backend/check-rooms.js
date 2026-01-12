const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roomsByBuilding = await prisma.room.groupBy({
    by: ['buildingId'],
    _count: { id: true },
  });
  const buildings = await prisma.building.findMany({
    select: { id: true, name: true },
  });

  console.log('--- ROOMS PER BUILDING ---');
  buildings.forEach((b) => {
    const r = roomsByBuilding.find((rb) => rb.buildingId === b.id);
    console.log(`${b.name} (ID: ${b.id}): ${r ? r._count.id : 0} rooms`);
  });
  console.log('--------------------------');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
