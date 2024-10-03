const findOrCreateTag = async (prisma, tagName) => {
    let tag = await prisma.tag.findUnique({ where: { name: tagName } });
    if (!tag) {
      tag = await prisma.tag.create({ data: { name: tagName } });
    }
    return tag;
  };
  
  module.exports = {
    users: async (args, { prisma }) => {
      try {
        return await prisma.user.findMany({ include: { likes: true, dislikes: true } });
      } catch (error) {
        throw new Error('Error fetching users: ' + error.message);
      }
    },
    user: async ({ id }, { prisma }) => {
      try {
        return await prisma.user.findUnique({
          where: { id: Number(id) },
          include: { likes: true, dislikes: true },
        });
      } catch (error) {
        throw new Error('Error fetching user: ' + error.message);
      }
    },
      createUser: async ({ name, email }, { prisma }) => {
      try {
        return await prisma.user.create({ data: { name, email } });
      } catch (error) {
        throw new Error('Error creating user: ' + error.message);
      }
    },
    addLike: async ({ userId, tagName }, { prisma }) => {
      try {
        const tag = await findOrCreateTag(prisma, tagName);
        return await prisma.user.update({
          where: { id: Number(userId) },
          data: {
            likes: { connect: { id: tag.id } },
          },
          include: { likes: true, dislikes: true },
        });
      } catch (error) {
        throw new Error('Error adding like: ' + error.message);
      }
    },
    addDislike: async ({ userId, tagName }, { prisma }) => {
      try {
        const tag = await findOrCreateTag(prisma, tagName);
        return await prisma.user.update({
          where: { id: Number(userId) },
          data: {
            dislikes: { connect: { id: tag.id } },
          },
          include: { likes: true, dislikes: true },
        });
      } catch (error) {
        throw new Error('Error adding dislike: ' + error.message);
      }
    },
  };
 