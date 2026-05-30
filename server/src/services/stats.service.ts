import { prisma } from "../config/database";

export async function getSummary(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayNew, pendingReview, mastered] = await Promise.all([
    prisma.mistake.count({
      where: {
        userId,
        createdAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.reviewSchedule.count({
      where: {
        userId,
        status: "pending",
        reviewDate: { lte: tomorrow },
      },
    }),
    prisma.mistake.count({
      where: {
        userId,
        masteryStatus: "mastered",
      },
    }),
  ]);

  const allMistakes = await prisma.mistake.findMany({
    where: { userId },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  let streak = 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const dateSet = new Set(
    allMistakes.map((m) => m.createdAt.toISOString().split("T")[0])
  );

  let checkDate = new Date(now);
  while (dateSet.has(checkDate.toISOString().split("T")[0])) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return {
    todayNew,
    pendingReview,
    mastered,
    streak,
  };
}

export async function getTrend(
  userId: string,
  period: "week" | "month" = "week",
  subjectId?: string
) {
  const now = new Date();
  const startDate = new Date();

  if (period === "week") {
    startDate.setDate(now.getDate() - 7 * 12);
  } else {
    startDate.setMonth(now.getMonth() - 12);
  }

  const where: any = {
    userId,
    createdAt: { gte: startDate },
  };

  if (subjectId) {
    where.subjectId = subjectId;
  }

  const mistakes = await prisma.mistake.findMany({
    where,
    select: {
      createdAt: true,
      masteryStatus: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const grouped: Record<string, { total: number; mastered: number }> = {};

  for (const m of mistakes) {
    let key: string;
    if (period === "week") {
      const weekStart = new Date(m.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      key = weekStart.toISOString().split("T")[0];
    } else {
      key = `${m.createdAt.getFullYear()}-${String(m.createdAt.getMonth() + 1).padStart(2, "0")}`;
    }

    if (!grouped[key]) {
      grouped[key] = { total: 0, mastered: 0 };
    }
    grouped[key].total++;
    if (m.masteryStatus === "mastered") {
      grouped[key].mastered++;
    }
  }

  const trend = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      total: data.total,
      mastered: data.mastered,
      masteryRate: data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0,
    }));

  return trend;
}

export async function getErrorTypes(userId: string, subjectId?: string) {
  const where: any = { userId };

  if (subjectId) {
    where.subjectId = subjectId;
  }

  const result = await prisma.mistake.groupBy({
    by: ["errorType"],
    where,
    _count: { id: true },
  });

  const labels: Record<string, string> = {
    concept: "概念错误",
    compute: "计算错误",
    read: "审题错误",
    forget: "遗忘错误",
    method: "方法错误",
  };

  return result.map((item) => ({
    type: item.errorType,
    label: labels[item.errorType || ""] || "未分类",
    count: item._count.id,
  }));
}

export async function getKnowledgeWeakness(userId: string, subjectId?: string) {
  const where: any = { userId };

  if (subjectId) {
    where.subjectId = subjectId;
  }

  const mistakes = await prisma.mistake.findMany({
    where,
    select: {
      id: true,
      title: true,
      subjectId: true,
      chapterId: true,
      subject: { select: { name: true } },
      chapter: { select: { name: true } },
    },
  });

  const subjectMap: Record<string, { subject: string; chapters: { name: string; mistakeCount: number }[] }> = {};

  for (const m of mistakes) {
    const subjectName = m.subject.name;
    const chapterName = m.chapter?.name || "未分类";

    if (!subjectMap[subjectName]) {
      subjectMap[subjectName] = {
        subject: subjectName,
        chapters: [],
      };
    }

    const chapterIndex = subjectMap[subjectName].chapters.findIndex(
      (c) => c.name === chapterName
    );

    if (chapterIndex >= 0) {
      subjectMap[subjectName].chapters[chapterIndex].mistakeCount++;
    } else {
      subjectMap[subjectName].chapters.push({
        name: chapterName,
        mistakeCount: 1,
      });
    }
  }

  return Object.values(subjectMap);
}
