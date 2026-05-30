import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";

const prisma = new PrismaClient();

const presetSubjects = [
  { name: "语文", icon: "📖", sortOrder: 1 },
  { name: "数学", icon: "📐", sortOrder: 2 },
  { name: "英语", icon: "🔤", sortOrder: 3 },
  { name: "物理", icon: "⚡", sortOrder: 4 },
  { name: "化学", icon: "🧪", sortOrder: 5 },
  { name: "生物", icon: "🧬", sortOrder: 6 },
  { name: "历史", icon: "📜", sortOrder: 7 },
  { name: "地理", icon: "🌍", sortOrder: 8 },
  { name: "政治", icon: "⚖️", sortOrder: 9 },
];

function generateToken(userId: string, phone: string, expiresIn: string) {
  return jwt.sign({ id: userId, phone }, config.jwt.secret, { expiresIn: expiresIn as any });
}

export async function register(
  phone: string,
  password: string,
  nickname: string,
  gradeLevel: string
) {
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    throw Object.assign(new Error("该手机号已注册"), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      phone,
      password: hashedPassword,
      nickname,
      gradeLevel,
      subjects: {
        create: presetSubjects.map((s) => ({
          ...s,
          isPreset: true,
        })),
      },
    },
    select: {
      id: true,
      phone: true,
      nickname: true,
      avatarUrl: true,
      gradeLevel: true,
      grade: true,
      createdAt: true,
    },
  });

  const token = generateToken(user.id, user.phone, config.jwt.expiresIn);
  const refreshToken = generateToken(
    user.id,
    user.phone,
    config.jwt.refreshExpiresIn
  );

  return { user, token, refreshToken };
}

export async function login(phone: string, password: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw Object.assign(new Error("手机号或密码错误"), { statusCode: 401 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw Object.assign(new Error("手机号或密码错误"), { statusCode: 401 });
  }

  const token = generateToken(user.id, user.phone, config.jwt.expiresIn);
  const refreshToken = generateToken(
    user.id,
    user.phone,
    config.jwt.refreshExpiresIn
  );

  return {
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      gradeLevel: user.gradeLevel,
      grade: user.grade,
      createdAt: user.createdAt,
    },
    token,
    refreshToken,
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      nickname: true,
      avatarUrl: true,
      gradeLevel: true,
      grade: true,
      createdAt: true,
      _count: {
        select: {
          mistakes: true,
          reviewSchedules: { where: { status: "pending" } },
        },
      },
    },
  });

  if (!user) {
    throw Object.assign(new Error("用户不存在"), { statusCode: 404 });
  }

  return user;
}

export async function updateProfile(
  userId: string,
  data: {
    nickname?: string;
    avatarUrl?: string;
    gradeLevel?: string;
    grade?: string;
  }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      phone: true,
      nickname: true,
      avatarUrl: true,
      gradeLevel: true,
      grade: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}
