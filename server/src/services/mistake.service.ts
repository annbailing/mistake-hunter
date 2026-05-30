import { PrismaClient } from "@prisma/client";
import { aiService } from "../utils/ai";

const prisma = new PrismaClient();

interface CreateMistakeData {
  subjectId: string;
  chapterId?: string;
  title: string;
  content: string;
  myAnswer?: string;
  correctAnswer?: string;
  source?: string;
  sourceDate?: string;
  errorType?: string;
  tagIds?: string[];
  images?: Array<{ filePath: string; thumbnailPath?: string; ocrText?: string }>;
}

interface MistakeFilters {
  subjectId?: string;
  errorType?: string;
  tagId?: string;
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export async function create(userId: string, data: CreateMistakeData) {
  const reviewDate = new Date();
  reviewDate.setDate(reviewDate.getDate() + 1);

  const mistake = await prisma.$transaction(async (tx) => {
    const created = await tx.mistake.create({
      data: {
        userId,
        subjectId: data.subjectId,
        chapterId: data.chapterId,
        title: data.title,
        content: data.content,
        myAnswer: data.myAnswer,
        correctAnswer: data.correctAnswer,
        source: data.source,
        sourceDate: data.sourceDate ? new Date(data.sourceDate) : undefined,
        errorType: data.errorType,
        images: data.images
          ? {
              create: data.images.map((img, index) => ({
                filePath: img.filePath,
                thumbnailPath: img.thumbnailPath,
                ocrText: img.ocrText,
                sortOrder: index,
              })),
            }
          : undefined,
        mistakeTags: data.tagIds
          ? {
              create: data.tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
        reviewSchedules: {
          create: {
            userId,
            reviewDate,
            reviewRound: 1,
          },
        },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        mistakeTags: { include: { tag: true } },
        subject: true,
        chapter: true,
        reviewSchedules: true,
      },
    });

    return created;
  });

  return mistake;
}

export async function getList(userId: string, filters: MistakeFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { userId };

  if (filters.subjectId) {
    where.subjectId = filters.subjectId;
  }

  if (filters.errorType) {
    where.errorType = filters.errorType;
  }

  if (filters.tagId) {
    where.mistakeTags = {
      some: { tagId: filters.tagId },
    };
  }

  if (filters.keyword) {
    where.OR = [
      { title: { contains: filters.keyword } },
      { content: { contains: filters.keyword } },
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      where.createdAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.createdAt.lte = new Date(filters.dateTo);
    }
  }

  const [mistakes, total] = await Promise.all([
    prisma.mistake.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        mistakeTags: { include: { tag: true } },
        subject: true,
        chapter: true,
        aiAnalysis: true,
        _count: {
          select: { variantQuestions: true },
        },
      },
    }),
    prisma.mistake.count({ where }),
  ]);

  return {
    list: mistakes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getById(userId: string, id: string) {
  const mistake = await prisma.mistake.findFirst({
    where: { id, userId },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      mistakeTags: { include: { tag: true } },
      subject: true,
      chapter: true,
      aiAnalysis: true,
      variantQuestions: {
        orderBy: { sortOrder: "asc" },
        include: {
          variantAnswers: {
            where: { userId },
            orderBy: { answeredAt: "desc" },
            take: 1,
          },
        },
      },
      reviewSchedules: {
        orderBy: { reviewDate: "desc" },
        take: 5,
      },
    },
  });

  if (!mistake) {
    throw Object.assign(new Error("错题不存在"), { statusCode: 404 });
  }

  return mistake;
}

export async function update(userId: string, id: string, data: Partial<CreateMistakeData>) {
  const mistake = await prisma.mistake.findFirst({
    where: { id, userId },
  });

  if (!mistake) {
    throw Object.assign(new Error("错题不存在"), { statusCode: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (data.tagIds) {
      await tx.mistakeTag.deleteMany({ where: { mistakeId: id } });
    }

    const result = await tx.mistake.update({
      where: { id },
      data: {
        subjectId: data.subjectId,
        chapterId: data.chapterId,
        title: data.title,
        content: data.content,
        myAnswer: data.myAnswer,
        correctAnswer: data.correctAnswer,
        source: data.source,
        sourceDate: data.sourceDate ? new Date(data.sourceDate) : undefined,
        errorType: data.errorType,
        mistakeTags: data.tagIds
          ? {
              create: data.tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        mistakeTags: { include: { tag: true } },
        subject: true,
        chapter: true,
      },
    });

    return result;
  });

  return updated;
}

export async function remove(userId: string, id: string) {
  const mistake = await prisma.mistake.findFirst({
    where: { id, userId },
  });

  if (!mistake) {
    throw Object.assign(new Error("错题不存在"), { statusCode: 404 });
  }

  await prisma.mistake.delete({ where: { id } });
}

export async function batchRemove(userId: string, ids: string[]) {
  const result = await prisma.mistake.deleteMany({
    where: {
      id: { in: ids },
      userId,
    },
  });

  return { deletedCount: result.count };
}

export async function analyzeError(userId: string, id: string) {
  const mistake = await prisma.mistake.findFirst({
    where: { id, userId },
  });

  if (!mistake) {
    throw Object.assign(new Error("错题不存在"), { statusCode: 404 });
  }

  const analysis = await aiService.analyzeError(
    mistake.content,
    mistake.myAnswer,
    mistake.correctAnswer
  );

  const result = await prisma.$transaction(async (tx) => {
    const aiAnalysis = await tx.aiAnalysis.upsert({
      where: { mistakeId: id },
      update: {
        errorType: analysis.error_type,
        analysis: analysis.analysis,
        suggestion: analysis.suggestion,
        modelUsed: "ai",
      },
      create: {
        mistakeId: id,
        errorType: analysis.error_type,
        analysis: analysis.analysis,
        suggestion: analysis.suggestion,
        modelUsed: "ai",
      },
    });

    if (analysis.error_type) {
      await tx.mistake.update({
        where: { id },
        data: { errorType: analysis.error_type },
      });
    }

    return aiAnalysis;
  });

  return result;
}

export async function generateVariants(userId: string, id: string) {
  const mistake = await prisma.mistake.findFirst({
    where: { id, userId },
  });

  if (!mistake) {
    throw Object.assign(new Error("错题不存在"), { statusCode: 404 });
  }

  const variants = await aiService.generateVariants(mistake.content);

  if (variants.length === 0) {
    throw Object.assign(new Error("变体题生成失败"), { statusCode: 500 });
  }

  const result = await prisma.variantQuestion.createMany({
    data: variants.map((v, index) => ({
      mistakeId: id,
      content: v.content,
      answer: v.answer,
      difficulty: v.difficulty,
      sortOrder: index,
    })),
  });

  const created = await prisma.variantQuestion.findMany({
    where: { mistakeId: id },
    orderBy: { sortOrder: "asc" },
  });

  return created;
}

export async function markMastered(userId: string, id: string) {
  const mistake = await prisma.mistake.findFirst({
    where: { id, userId },
  });

  if (!mistake) {
    throw Object.assign(new Error("错题不存在"), { statusCode: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.mistake.update({
      where: { id },
      data: {
        masteryStatus: "mastered",
        masteredAt: new Date(),
      },
    });

    await tx.reviewSchedule.updateMany({
      where: {
        mistakeId: id,
        status: "pending",
      },
      data: {
        status: "skipped",
      },
    });

    return result;
  });

  return updated;
}
