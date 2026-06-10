// 种子脚本：从 lib/data/tools.ts 导入 69 工具 + 20 分类到数据库
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 导入工具数据
const { TOOLS, CATEGORIES } = require('../lib/data/tools');

async function main() {
  console.log('🌱 开始种子数据导入...');

  // 1. 清空现有数据
  await prisma.tool.deleteMany();
  await prisma.category.deleteMany();
  await prisma.article.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.adSpot.deleteMany();
  console.log('✅ 已清空现有数据');

  // 2. 导入分类（跳过 "all"）
  const categoriesToImport = CATEGORIES.filter((c: { key: string }) => c.key !== 'all');
  for (let i = 0; i < categoriesToImport.length; i++) {
    const cat = categoriesToImport[i];
    await prisma.category.create({
      data: {
        key: cat.key,
        label: cat.label,
        sort: i,
      },
    });
  }
  console.log(`✅ 已导入 ${categoriesToImport.length} 个分类`);

  // 3. 导入工具
  for (const tool of TOOLS) {
    await prisma.tool.create({
      data: {
        name: tool.name,
        url: tool.url,
        business: tool.business,
        categoryKey: tool.category,
        affiliateUrl: tool.affiliateUrl,
        discount: tool.discount || '',
        featured: !!tool.discount, // 有优惠的默认推荐
        sort: 0,
      },
    });
  }
  console.log(`✅ 已导入 ${TOOLS.length} 个工具`);

  // 4. 创建默认广告位
  await prisma.adSpot.create({
    data: {
      key: 'homepage-hero',
      name: '首页 Banner',
      imageUrl: '',
      linkUrl: '',
      active: false,
      sort: 0,
    },
  });
  await prisma.adSpot.create({
    data: {
      key: 'homepage-sidebar',
      name: '首页侧边栏',
      imageUrl: '',
      linkUrl: '',
      active: false,
      sort: 1,
    },
  });
  console.log('✅ 已创建默认广告位');

  console.log('🎉 种子数据导入完成!');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据导入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
