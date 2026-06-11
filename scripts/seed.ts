// 种子脚本（幂等模式）：从 lib/data/tools.ts 同步 69 工具 + 20 分类到数据库
// 关键：不删除 admin 后台手工添加的数据，只 upsert lib/data/tools.ts 里有的
import { PrismaClient } from '@prisma/client';
import { TOOLS, CATEGORIES } from '../lib/data/tools';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始种子数据同步（幂等模式）...');

  // 1. 同步分类（upsert by key）
  const categoriesToImport = CATEGORIES.filter((c: { key: string }) => c.key !== 'all');
  for (let i = 0; i < categoriesToImport.length; i++) {
    const cat = categoriesToImport[i];
    await prisma.category.upsert({
      where: { key: cat.key },
      update: { label: cat.label, sort: i },
      create: { key: cat.key, label: cat.label, sort: i },
    });
  }
  console.log(`✅ 已同步 ${categoriesToImport.length} 个分类`);

  // 2. 同步工具（upsert by name），不会触碰 admin 后台手工添加的工具
  for (const tool of TOOLS) {
    await prisma.tool.upsert({
      where: { name: tool.name },
      update: {
        url: tool.url,
        business: tool.business,
        categoryKey: tool.category,
        affiliateUrl: tool.affiliateUrl,
        discount: tool.discount || '',
      },
      create: {
        name: tool.name,
        url: tool.url,
        business: tool.business,
        categoryKey: tool.category,
        affiliateUrl: tool.affiliateUrl,
        discount: tool.discount || '',
        featured: !!tool.discount,
        sort: 0,
      },
    });
  }
  console.log(`✅ 已同步 ${TOOLS.length} 个工具`);

  // 3. 确保默认广告位存在
  const adSpots = [
    { key: 'homepage-hero', name: '首页 Banner', sort: 0 },
    { key: 'homepage-sidebar', name: '首页侧边栏', sort: 1 },
  ];
  for (const spot of adSpots) {
    await prisma.adSpot.upsert({
      where: { key: spot.key },
      update: { name: spot.name, sort: spot.sort },
      create: { ...spot, imageUrl: '', linkUrl: '', active: false },
    });
  }
  console.log('✅ 广告位已就绪');

  console.log('🎉 种子数据同步完成！');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据导入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
