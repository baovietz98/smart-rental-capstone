const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('--- Checking Users & Tenants ---');
  const users = await prisma.user.findMany({
    include: { tenant: true },
  });

  users.forEach((u) => {
    console.log(
      `User: ${u.email} (Role: ${u.role}) -> Tenant: ${u.tenant ? u.tenant.fullName : 'NULL'}`,
    );
  });
}

check()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
