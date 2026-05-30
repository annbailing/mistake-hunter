import { aiService } from "../utils/ai";
import { prisma } from "../config/database";

export async function getById(userId: string, id: string) {
  const variant = await prisma.variantQuestion.findFirst({
    where: {
      id,
      mistake: { userId },
    },
    include: {
      mistake: {
        select: {
          id: true,
          title: true,
          subject: { select: { id: true, name: true } },
        },
      },
      variantAnswers: {
        where: { userId },
        orderBy: { answeredAt: "desc" },
      },
    },
  });

  if (!variant) {
    throw Object.assign(new Error("变体题不存在"), { statusCode: 404 });
  }

  return variant;
}

export async function submitAnswer(
  userId: string,
  id: string,
  myAnswer: string
) {
  const variant = await prisma.variantQuestion.findFirst({
    where: {
      id,
      mistake: { userId },
    },
  });

  if (!variant) {
    throw Object.assign(new Error("变体题不存在"), { statusCode: 404 });
  }

  const isCorrect = await aiService.judgeAnswer(
    variant.content,
    variant.answer,
    myAnswer
  );

  const answer = await prisma.variantAnswer.create({
    data: {
      userId,
      variantId: id,
      myAnswer,
      isCorrect,
    },
  });

  return {
    ...answer,
    correctAnswer: variant.answer,
  };
}
