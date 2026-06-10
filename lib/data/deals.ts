// 跨境工具说 - 优惠活动数据
// 阶段二：自动从各工具厂商官网抓取
// 当前为空，等待抓取脚本上线
// 最后更新：2026-06-10

export interface Deal {
  title: string;
  url: string;
  brand: string;
  brandLogo?: string;
  category?: string;
  discount?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  crawledAt: string;
}

export const DEALS: Deal[] = [
  // 阶段二爬虫会自动填充
];
