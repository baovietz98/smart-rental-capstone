const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    // There isn't a direct way to check schema types via Prisma Client at runtime easily
    // without inspecting the dmmf or using raw query.
    // However, I can try to find the 'InvoiceDetail' or 'InvoiceLineItem' model definition if accessible,
    // or just assume standard behavior.

    // A better approach is to check the prisma.schema file content if possible,
    // but I don't have direct access to read it via this script.
    // Instead, I will write a dummy test record with a large number to see if it fails.

    console.log('Checking InvoiceLineItem schema capabilities...');

    // I will try to create a dummy invoice if possible, or just log success if I can connect.
    // Since I cannot easily inspect schema types, I will rely on my general knowledge
    // and standard practices (Decimal(18,2) or Int).
    // But I can try to read the schema file using fs since I am in a node env.

    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'src', 'prisma', 'schema.prisma'); // Adjust path as needed

    // Try different common paths for schema.prisma
    const p1 = path.join(__dirname, 'prisma', 'schema.prisma');
    const p2 = path.join(__dirname, 'src', 'prisma', 'schema.prisma');
    const p3 = 'c:/Users/Admin/quan-ly-nha-tro/backend/prisma/schema.prisma';

    let content = '';
    if (fs.existsSync(p1)) content = fs.readFileSync(p1, 'utf8');
    else if (fs.existsSync(p2)) content = fs.readFileSync(p2, 'utf8');
    else if (fs.existsSync(p3)) content = fs.readFileSync(p3, 'utf8');

    if (content) {
      console.log('Found schema.prisma!');
      // Look for InvoiceLineItem or similar
      const lines = content.split('\n');
      let inModel = false;
      for (const line of lines) {
        if (
          line.includes('model InvoiceLineItem') ||
          line.includes('model InvoiceDetail')
        ) {
          inModel = true;
          console.log(line);
        } else if (inModel && line.includes('}')) {
          inModel = false;
        } else if (inModel) {
          if (line.includes('unitPrice') || line.includes('amount')) {
            console.log(line.trim());
          }
        }
      }
    } else {
      console.log('Could not find schema.prisma to inspect.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
