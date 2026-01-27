const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReadings() {
  try {
    const readings = await prisma.serviceReading.findMany({
      where: {
        month: '01-2026',
      },
      include: {
        contract: {
          include: { tenant: true },
        },
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (readings.length === 0) {
      console.log('No readings found for 01-2026 yet.');
    } else {
      console.log(`Found ${readings.length} readings for 01-2026:`);
      readings.forEach((r) => {
        console.log(
          `- [${r.service.name}] Tenant: ${r.contract.tenant?.fullName || 'N/A'} | Old: ${r.oldIndex} -> New: ${r.newIndex} | Usage: ${r.usage} | Reset: ${r.isMeterReset} | Confirmed: ${r.isConfirmed}`,
        );
      });
    }
  } catch (error) {
    console.error('Error checking readings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReadings();
