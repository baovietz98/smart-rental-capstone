const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBuildings() {
  try {
    const buildings = await prisma.building.findMany();
    console.log('Total Buildings in DB:', buildings.length);
    console.log(JSON.stringify(buildings, null, 2));
  } catch (error) {
    console.error('Error fetching buildings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBuildings();
