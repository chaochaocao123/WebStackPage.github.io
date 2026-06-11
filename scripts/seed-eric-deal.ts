// 入库一条睿观 eric-bot.com 618 大促优惠
// 用法：DATABASE_URL=... npx tsx scripts/seed-eric-deal.ts
// 2026-06-11

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ERIC_DEAL = {
  title: '16.8元！睿观查侵权套餐，错过等明年',
  url: 'https://eric-bot.com/serviceplan/618plan',
  brand: '睿观',
  brandLogo: 'https://eric-cdn.eric-bot.com/original/20241231/6c8c8f36-b70e-db5e-00e9-ec95349733ed.jpg',
  category: '知识产权 / 侵权检测',
  discount: '16.8元起（618大促）',
  description: [
    '【16.8元套餐】7天有效，每个ID限购1次，活动结束全部下架',
    '【618元套餐】活动后即下架',
    '【旺季全店护航包】180天长效，覆盖下半年旺季',
    '【年度全能旗舰包】1年有效期，批量检测+子账号',
    '',
    '618大促专项护航，距 Prime Day 不到 30 天。',
    '本次16.8元/618元套餐由平台专项补贴+新客首购权益叠加，非日常定价体系。',
  ].join('\n'),
  startDate: new Date('2026-06-05'),
  // 618 大促通常到 6 月 18 日，加上备份到月底
  endDate: new Date('2026-06-30'),
  source: 'manual',
};

async function main() {
  // 用 url 去重
  const exist = await prisma.deal.findFirst({
    where: { url: ERIC_DEAL.url },
  });

  if (exist) {
    console.log(`已存在 id=${exist.id}，更新字段...`);
    await prisma.deal.update({
      where: { id: exist.id },
      data: ERIC_DEAL,
    });
    console.log(`✓ 更新成功：id=${exist.id}`);
  } else {
    const created = await prisma.deal.create({
      data: ERIC_DEAL,
    });
    console.log(`✓ 创建成功：id=${created.id}`);
  }

  const all = await prisma.deal.count();
  console.log(`\n当前 Deal 表共 ${all} 条记录`);
}

main()
  .catch((e) => {
    console.error('✗ 失败：', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
