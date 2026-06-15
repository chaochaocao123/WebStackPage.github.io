import { prisma } from '@/lib/db';

/**
 * 根据 key 读取单个启用的广告位
 * 用途：首页 Hero 右侧广告位（v11.37 2026-06-15 曹总要接真实广告主）
 * 缓存：复用首页 5 分钟 ISR（revalidate=300）
 * 草稿保护：只取 active=true 的
 */
export async function getAdSpotByKey(key: string) {
  return prisma.adSpot.findFirst({
    where: { key, active: true },
  });
}
