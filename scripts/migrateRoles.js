const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      role: 'user',
    },
    data: {
      role: 'student',
    },
  });
  console.log(`Migrated ${result.count} users from "user" to "student" role.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
