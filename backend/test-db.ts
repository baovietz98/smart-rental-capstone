import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing database connection...');
    try {
        await prisma.$connect();
        console.log('✅ Successfully connected to the database!');

        // Test a query
        const buildingCount = await prisma.building.count();
        console.log(`Database accessible. Found ${buildingCount} buildings.`);

    } catch (error) {
        console.error('❌ Database connection failed!');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
