// 跨境工具说 - 资讯数据
// 阶段二：自动从 amz123、mjzj、wearesellers、cifnews 抓取
// 当前为空，等待抓取脚本上线
// 最后更新：2026-06-10

export interface NewsItem {
  title: string;
  url: string;
  source: 'amz123' | 'mjzj' | 'wearesellers' | 'cifnews' | string;
  sourceLogo?: string;
  summary?: string;
  cover?: string;
  category?: string;
  publishedAt: string;  // ISO 时间
  crawledAt: string;
}

export const NEWS: NewsItem[] = [
  // 阶段二爬虫会自动填充
];
