const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany();
  console.log(accounts);
}

main();
