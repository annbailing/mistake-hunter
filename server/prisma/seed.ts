import { PrismaClient } from "@prisma/client";

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
