const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const contracts = await prisma.contract.findMany({ where: { isActive: true }, include: { room: true } });
  console.log('All active contracts:', contracts.map(c => ({ id: c.id, room: c.room.name, building: c.room.buildingId })));
}
main();
