import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const presetSubjects = [
  { name: "高等数学", icon: "📐", sortOrder: 1 },
  { name: "线性代数", icon: "📊", sortOrder: 2 },
  { name: "概率论", icon: "🎲", sortOrder: 3 },
  { name: "数据结构", icon: "🌲", sortOrder: 4 },
  { name: "操作系统", icon: "💻", sortOrder: 5 },
  { name: "计算机组成原理", icon: "🔧", sortOrder: 6 },
  { name: "计算机网络", icon: "🌐", sortOrder: 7 },
];

async function main() {
  console.log("Seeding database...");

  const testUser = await prisma.user.upsert({
    where: { phone: "13800000000" },
    update: {},
    create: {
      phone: "13800000000",
      password: "$2a$10$dummy.hash.for.seeding.purposes.only",
      nickname: "测试用户",
      gradeLevel: "senior",
      grade: "高三",
      subjects: {
        create: presetSubjects.map((s) => ({
          ...s,
          isPreset: true,
        })),
      },
    },
  });

  console.log(`Created test user: ${testUser.nickname} (${testUser.id})`);
  console.log(`Created ${presetSubjects.length} preset subjects`);
  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
