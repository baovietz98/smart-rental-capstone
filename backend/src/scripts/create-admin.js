const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'baoviet010598@gmail.com';
  const plainPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Check if exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(
      'User already exists. Updating password and making sure role is ADMIN.',
    );
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('User updated successfully!');
  } else {
    console.log('Creating new ADMIN user...');
    await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: 'Bao Viet Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('User created successfully!');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
