import { prisma } from "../config/database";

export async function getToday(userId: string) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const reviews = await prisma.reviewSchedule.findMany({
    where: {
      userId,
      status: "pending",
      reviewDate: { lte: today },
    },
    orderBy: { reviewDate: "asc" },
    include: {
      mistake: {
        include: {
          subject: true,
          chapter: true,
          images: { take: 1, orderBy: { sortOrder: "asc" } },
          mistakeTags: { include: { tag: true } },
          aiAnalysis: true,
        },
      },
    },
  });

  return reviews;
}

export async function complete(
  userId: string,
  reviewId: string,
  feedback: string
) {
  const review = await prisma.reviewSchedule.findFirst({
    where: { id: reviewId, userId },
  });

  if (!review) {
    throw Object.assign(new Error("复习计划不存在"), { statusCode: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.reviewSchedule.update({
      where: { id: reviewId },
      data: {
        status: "completed",
        feedback,
        completedAt: new Date(),
      },
    });

    if (feedback === "mastered") {
      await tx.mistake.update({
        where: { id: review.mistakeId },
        data: {
          masteryStatus: "mastered",
          masteredAt: new Date(),
        },
      });
    } else if (feedback === "fuzzy") {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 2);

      await tx.reviewSchedule.create({
        data: {
          userId,
          mistakeId: review.mistakeId,
          reviewDate: nextDate,
          reviewRound: review.reviewRound + 1,
        },
      });

      await tx.mistake.update({
        where: { id: review.mistakeId },
        data: { masteryStatus: "reviewing" },
      });
    } else if (feedback === "forgot") {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);

      await tx.reviewSchedule.create({
        data: {
          userId,
          mistakeId: review.mistakeId,
          reviewDate: nextDate,
          reviewRound: 1,
        },
      });

      await tx.mistake.update({
        where: { id: review.mistakeId },
        data: { masteryStatus: "unmastered" },
      });
    }

    return updated;
  });

  return result;
}

export async function getSchedule(userId: string) {
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1, 0);
  endDate.setHours(23, 59, 59, 999);

  const reviews = await prisma.reviewSchedule.findMany({
    where: {
      userId,
      reviewDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { reviewDate: "asc" },
    include: {
      mistake: {
        select: {
          id: true,
          title: true,
          subject: { select: { name: true, icon: true } },
        },
      },
    },
  });

  const scheduleMap: Record<
    string,
    Array<{
      id: string;
      status: string;
      mistake: { id: string; title: string; subject: { name: string; icon: string | null } };
    }>
  > = {};

  for (const review of reviews) {
    const dateKey = review.reviewDate.toISOString().split("T")[0];
    if (!scheduleMap[dateKey]) {
      scheduleMap[dateKey] = [];
    }
    scheduleMap[dateKey].push({
      id: review.id,
      status: review.status,
      mistake: review.mistake as any,
    });
  }

  return scheduleMap;
}
