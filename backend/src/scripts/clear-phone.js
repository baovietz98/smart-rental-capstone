const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const adminDemo = await prisma.user.findFirst({
    where: { email: 'admin@demo.com' },
  });
  if (adminDemo) {
    await prisma.user.update({
      where: { id: adminDemo.id },
      data: { phoneNumber: null },
    });
    console.log('Cleared phone number for admin@demo.com');
  }
}
main().finally(() => prisma.$disconnect());
