const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const account = await prisma.account.findUnique({ where: { code: '676767' }});
  console.log('Account:', account);
  
  if (!account) return;

  const tokenRes = await fetch("https://api.mail.tm/token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        address: account.email,
        password: account.password
      })
  });
  
  const { token } = await tokenRes.json();
  console.log('Token:', token);

  const msgRes = await fetch("https://api.mail.tm/messages", {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
  });

  const msgData = await msgRes.json();
  console.log('Messages:', JSON.stringify(msgData, null, 2));
}

check().then(() => prisma.$disconnect());
