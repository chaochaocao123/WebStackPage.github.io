// 跨境工具说 - 优惠活动数据
// 来源：
//   - 自动抓取：scripts/crawl-deals.ts（amz123 等源）
//   - 手动录入：admin/deals 页面
// 最后更新：2026-06-11

import { prisma } from '@/lib/db';

export interface DealItem {
  id: number;
  title: string;
  url: string;
  brand: string;
  brandLogo?: string | null;
  category?: string | null;
  discount?: string | null;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 从数据库读取优惠活动列表
 * - 按创建时间倒序（管理员手动置顶的可以改 startDate 让它排前）
 * - 默认最多 100 条
 */
export async function getDealsFromDB(limit = 100): Promise<DealItem[]> {
  const rows = await prisma.deal.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return rows.map((d) => ({
    id: d.id,
    title: d.title,
    url: d.url,
    brand: d.brand,
    brandLogo: d.brandLogo,
    category: d.category,
    discount: d.discount,
    description: d.description,
    startDate: d.startDate ? d.startDate.toISOString() : null,
    endDate: d.endDate ? d.endDate.toISOString() : null,
    source: d.source,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));
}
