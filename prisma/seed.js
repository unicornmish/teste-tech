const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tagNames = [
    'JavaScript',
    'Python',
    'Java',
    'Ruby',
    'Go',
    'C#',
    'TypeScript',
    'Rust',
  ];

  for (const name of tagNames) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const userNames = [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' },
    { name: 'Charlie', email: 'charlie@example.com' },
    { name: 'Diana', email: 'diana@example.com' },
    { name: 'Ethan', email: 'ethan@example.com' },
  ];

  for (const user of userNames) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
  const bob = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });

  await prisma.user.update({
    where: { id: alice.id },
    data: {
      likes: {
        connect: [{ name: 'JavaScript' }, { name: 'Python' }],
      },
      dislikes: {
        connect: [{ name: 'Ruby' }],
      },
    },
  });

  await prisma.user.update({
    where: { id: bob.id },
    data: {
      likes: {
        connect: [{ name: 'Java' }, { name: 'C#' }],
      },
      dislikes: {
        connect: [{ name: 'Go' }],
      },
    },
  });

  console.log('Dados inseridos com sucesso!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
