import { prisma } from "../config/database";

export async function getAll(userId: string) {
  const subjects = await prisma.subject.findMany({
    where: { userId },
    include: {
      chapters: {
        where: { parentId: null },
        orderBy: { sortOrder: "asc" },
        include: {
          children: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return subjects;
}

export async function create(
  userId: string,
  data: { name: string; icon?: string; sortOrder?: number }
) {
  const subject = await prisma.subject.create({
    data: {
      userId,
      name: data.name,
      icon: data.icon,
      sortOrder: data.sortOrder || 0,
    },
  });

  return subject;
}

export async function update(
  userId: string,
  id: string,
  data: { name?: string; icon?: string; sortOrder?: number }
) {
  const subject = await prisma.subject.findFirst({
    where: { id, userId },
  });

  if (!subject) {
    throw Object.assign(new Error("科目不存在"), { statusCode: 404 });
  }

  const updated = await prisma.subject.update({
    where: { id },
    data,
  });

  return updated;
}

export async function remove(userId: string, id: string) {
  const subject = await prisma.subject.findFirst({
    where: { id, userId },
  });

  if (!subject) {
    throw Object.assign(new Error("科目不存在"), { statusCode: 404 });
  }

  await prisma.subject.delete({ where: { id } });
}

export async function getChapters(userId: string, subjectId: string) {
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId },
  });

  if (!subject) {
    throw Object.assign(new Error("科目不存在"), { statusCode: 404 });
  }

  const chapters = await prisma.chapter.findMany({
    where: { subjectId, parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return chapters;
}

export async function createChapter(
  userId: string,
  subjectId: string,
  data: { name: string; parentId?: string; level?: number; sortOrder?: number }
) {
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId },
  });

  if (!subject) {
    throw Object.assign(new Error("科目不存在"), { statusCode: 404 });
  }

  if (data.parentId) {
    const parent = await prisma.chapter.findFirst({
      where: { id: data.parentId, subjectId },
    });

    if (!parent) {
      throw Object.assign(new Error("父章节不存在"), { statusCode: 404 });
    }
  }

  const chapter = await prisma.chapter.create({
    data: {
      subjectId,
      name: data.name,
      parentId: data.parentId,
      level: data.level || (data.parentId ? 2 : 1),
      sortOrder: data.sortOrder || 0,
    },
  });

  return chapter;
}
