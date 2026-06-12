// 查询 wearesellers 数据情况
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.news.count();
  console.log('--- News 总数 ---');
  console.log(total);

  const bySource = await prisma.news.groupBy({
    by: ['source'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });
  console.log('--- 按 source 分组 ---');
  console.log(JSON.stringify(bySource, null, 2));

  // wearesellers 详情
  const wearesellers = await prisma.news.findMany({
    where: { source: 'wearesellers' },
    select: {
      id: true,
      title: true,
      source: true,
      content: true,
      url: true,
      publishedAt: true,
      crawledAt: true,
    },
    orderBy: { publishedAt: 'desc' },
  });
  console.log(`--- wearesellers 详细列表（共 ${wearesellers.length} 条）---`);
  for (const n of wearesellers) {
    const contentLen = n.content ? n.content.length : 0;
    const pubDate = n.publishedAt.toISOString().slice(0, 10);
    const titleShort = n.title.length > 50 ? n.title.slice(0, 50) + '…' : n.title;
    console.log(`[id=${n.id}] pub=${pubDate} content=${contentLen}B ${titleShort}`);
  }

  // 时间跨度
  if (wearesellers.length > 0) {
    const oldest = wearesellers[wearesellers.length - 1];
    const newest = wearesellers[0];
    console.log('--- 时间跨度 ---');
    console.log(`最旧: ${oldest.publishedAt.toISOString().slice(0, 10)}  [id=${oldest.id}]`);
    console.log(`最新: ${newest.publishedAt.toISOString().slice(0, 10)}  [id=${newest.id}]`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
