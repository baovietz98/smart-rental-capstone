const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rs = require('./src/readings/readings.service');
  const service = new rs.ReadingsService(prisma);
  const result = await service.getUnreadRooms('03-2026', 7);
  console.log('Unread rooms:', JSON.stringify(result, null, 2));
}
main();
