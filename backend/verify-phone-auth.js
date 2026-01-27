const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Verification: Phone Auth & Linking ---');

  // 1. Create a dummy Tenant (Unlinked)
  const phone = '0999888777';
  await prisma.tenant.deleteMany({ where: { phone } });
  await prisma.user.deleteMany({ where: { phoneNumber: phone } });

  console.log('1. Creating Dummy Tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      fullName: 'Test Tenant For Auth',
      phone: phone,
      // userId should be null
    },
  });
  console.log('   Tenant created:', tenant.id, tenant.fullName);

  // 2. Call Register API
  console.log('2. Calling Register API with matching phone...');
  try {
    const response = await fetch('http://localhost:4000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testphone@demo.com',
        phoneNumber: phone,
        password: 'password123',
        name: 'Test This User',
        role: 'TENANT',
      }),
    });

    const data = await response.json();
    if (response.status !== 201) {
      console.error('   API Error:', response.status, data);
      throw new Error('Registration failed');
    }
    console.log('   User Registered:', data.user.id, data.user.name);

    // 3. Verify Link
    console.log('3. Verifying Database Link...');
    const updatedTenant = await prisma.tenant.findUnique({
      where: { id: tenant.id },
    });

    if (updatedTenant.userId === data.user.id) {
      console.log(
        '   SUCCESS: Tenant is linked to User ID',
        updatedTenant.userId,
      );
    } else {
      console.log(
        '   FAILURE: Tenant userId is',
        updatedTenant.userId,
        'Expected',
        data.user.id,
      );
    }
  } catch (e) {
    console.error('   Error during API call:', e);
  } finally {
    // Cleanup
    console.log('   Cleaning up...');
    await prisma.tenant.deleteMany({ where: { phone } });
    await prisma.user.deleteMany({ where: { phoneNumber: phone } });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
