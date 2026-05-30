import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAll(userId: string) {
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { mistakeTags: true },
      },
    },
  });

  return tags;
}

export async function create(userId: string, data: { name: string; color?: string }) {
  const tag = await prisma.tag.create({
    data: {
      userId,
      name: data.name,
      color: data.color,
    },
  });

  return tag;
}

export async function update(
  userId: string,
  id: string,
  data: { name?: string; color?: string }
) {
  const tag = await prisma.tag.findFirst({
    where: { id, userId },
  });

  if (!tag) {
    throw Object.assign(new Error("标签不存在"), { statusCode: 404 });
  }

  const updated = await prisma.tag.update({
    where: { id },
    data,
  });

  return updated;
}

export async function remove(userId: string, id: string) {
  const tag = await prisma.tag.findFirst({
    where: { id, userId },
  });

  if (!tag) {
    throw Object.assign(new Error("标签不存在"), { statusCode: 404 });
  }

  await prisma.tag.delete({ where: { id } });
}
