// 删除所有 wearesellers 源 News
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 删除前再确认一次数量
  const before = await prisma.news.count({ where: { source: 'wearesellers' } });
  console.log(`删除前 wearesellers 数量：${before}`);

  if (before === 0) {
    console.log('没有 wearesellers 数据，跳过删除');
    await prisma.$disconnect();
    return;
  }

  // 执行删除
  const result = await prisma.news.deleteMany({
    where: { source: 'wearesellers' },
  });
  console.log(`✓ 已删除 ${result.count} 条 wearesellers 数据`);

  // 验证
  const after = await prisma.news.count({ where: { source: 'wearesellers' } });
  console.log(`删除后 wearesellers 数量：${after}`);

  const totalAfter = await prisma.news.count();
  console.log(`News 表剩余总数：${totalAfter}`);

  const bySource = await prisma.news.groupBy({
    by: ['source'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });
  console.log('--- 删除后按 source 分组 ---');
  console.log(JSON.stringify(bySource, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
