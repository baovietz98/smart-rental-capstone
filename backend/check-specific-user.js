const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('--- Checking Specific User tenant@demo.com ---');
  const user = await prisma.user.findUnique({
    where: { email: 'tenant@demo.com' },
    include: { tenant: true },
  });

  if (user) {
    console.log(`User Found: ${user.email} (ID: ${user.id})`);
    console.log(
      `Linked Tenant: ${user.tenant ? user.tenant.fullName : 'NULL'}`,
    );
  } else {
    console.log('User tenant@demo.com NOT FOUND.');
  }

  const tenantA = await prisma.user.findUnique({
    where: { email: 'tenant.a@demo.com' },
    include: { tenant: true },
  });
  if (tenantA) {
    console.log(
      `User tenant.a@demo.com: Linked Tenant = ${tenantA.tenant ? tenantA.tenant.fullName : 'NULL'}`,
    );
  }
}

check()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
