
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log("Debugging Readings/Invoice Issue...");

  // 1. Find the Room
  const room = await prisma.room.findFirst({
    where: {
      name: 'L.01',
      building: {
        name: { contains: 'Landmark', mode: 'insensitive' }
      }
    },
    include: { building: true }
  });

  if (!room) {
    console.log("Room L.01 not found!");
    return;
  }
  console.log(`Found Room: ${room.name} (ID: ${room.id}) in Building: ${room.building.name}`);

  // 2. Find Contracts for this Room
  const contracts = await prisma.contract.findMany({
    where: { roomId: room.id },
    orderBy: { id: 'desc' }
  });

  console.log(`Found ${contracts.length} contracts for room ${room.id}:`);
  contracts.forEach(c => {
    console.log(`CONTRACT: ID=${c.id} Active=${c.isActive} Start=${c.startDate}`);
  });

  // 3. Find Readings for this Room (via contracts)
  const contractIds = contracts.map(c => c.id);
  const readings = await prisma.serviceReading.findMany({
    where: {
      contractId: { in: contractIds },
      month: '02-2026'
    },
    include: { service: true }
  });

  console.log(`Found ${readings.length} readings for 02-2026:`);
  readings.forEach(r => {
    console.log(`- Reading ID: ${r.id}, Service: ${r.service.name}, ContractID: ${r.contractId}, IsBilled: ${r.isBilled}`);
  });

  // 4. Simulate Invoice Creation Logic check
  // Assuming Frontend picks the first active contract
  const activeContract = contracts.find(c => c.isActive);
  if (activeContract) {
    console.log(` \n--- Validation Check for Active Contract ID: ${activeContract.id} ---`);
    const relevantReadings = readings.filter(r => r.contractId === activeContract.id);
    if (relevantReadings.length === 0) {
      console.log("ERROR: No readings found for the Active Contract! This explains the bug.");
    } else {
      console.log(`SUCCESS: Found ${relevantReadings.length} readings for active contract.`);
    }
  } else {
    console.log("ERROR: No active contract found!");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
