// 跨境工具说 - 文章数据
// 公众号文章手动导入/编辑后存这里
// 最后更新：2026-06-10

export interface Article {
  slug: string;
  title: string;
  content?: string;
  excerpt: string;
  cover?: string;
  category?: string;
  tags: string[];
  source?: string;
  sourceType: 'manual' | 'werss';
  author: string;
  publishedAt: string;
  viewCount: number;
}

// 初始空数组 - 等待曹总把公众号文章发过来导入
export const ARTICLES: Article[] = [
  // 示例：
  // {
  //   slug: 'demo',
  //   title: '示例文章',
  //   excerpt: '这是示例摘要',
  //   category: '亚马逊',
  //   tags: ['亚马逊', '选品'],
  //   sourceType: 'manual',
  //   author: '跨境工具说',
  //   publishedAt: '2026-06-10',
  //   viewCount: 0,
  // },
];
