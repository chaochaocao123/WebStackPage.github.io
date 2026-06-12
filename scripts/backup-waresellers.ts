// 备份 wearesellers 全部数据到 JSON（删除前的安全网）
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.news.findMany({
    where: { source: 'wearesellers' },
    orderBy: { publishedAt: 'desc' },
  });
  const filename = `/app/data/所有对话/主对话/kjgjs-site/scripts/waresellers-backup-${Date.now()}.json`;
  writeFileSync(filename, JSON.stringify(items, null, 2), 'utf-8');
  console.log(`备份完成：${items.length} 条 → ${filename}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
