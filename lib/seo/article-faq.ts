// v11.46 阶段八 GEO 站内优化 · Article FAQ Schema
// 参考 lib/seo/tool-faq.ts（v11.12 P1-5）模式
// 每篇 Article 自动生成 4 个常见问题，输出 FAQPage JSON-LD
// Princeton 研究：FAQPage Schema 可让 AI 引用率 +30-40%

export interface ArticleFAQ {
  question: string;
  answer: string;
}

export interface ArticleFAQInput {
  title: string;
  category: string | null;
  tags: string[];
  excerpt: string | null;
  content: string;
}

/** 从 HTML 提取纯文本 */
function htmlToText(html: string, maxLen = 200): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

/** 提取 answer-block 内的 40-75 字答案（v11.46 GEO 关键字段）
 *  v11.46 适配：Tiptap Blockquote + data-type=answer */
export function extractAbstract(html: string, maxLen = 75): string {
  if (!html) return '';
  // 优先匹配 blockquote[data-type="answer"]（Tiptap 兼容）
  const match = html.match(/<blockquote[^>]*data-type=["']answer["'][^>]*>([\s\S]*?)<\/blockquote>/i);
  const target = match ? match[1] : html;
  const text = htmlToText(target, 200);
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/[，。！？、：；]?\s*$/, '') + '…';
}

/** 生成 Article 模板化 FAQ（4 个常见问题） */
export function generateArticleFAQs(article: ArticleFAQInput): ArticleFAQ[] {
  const { title, category, tags, excerpt } = article;
  const tagStr = tags.length > 0 ? tags.slice(0, 3).join('、') : category || '跨境电商';
  const baseAnswer = excerpt || '跨境工具说已收录本文核心观点、实操步骤和工具推荐。';

  return [
    {
      question: `${title} 讲了什么？`,
      answer: `${baseAnswer}本文适合需要了解 ${tagStr} 的跨境卖家。跨境工具说持续追踪 ${tagStr} 领域最新动态，欢迎收藏。`,
    },
    {
      question: `${title} 适合哪些跨境卖家？`,
      answer: `本文主要面向亚马逊、TikTok、Temu、Shopee、Etsy 等平台的跨境电商卖家，尤其是对 ${tagStr} 感兴趣或正在选品的运营人员。不同规模卖家可根据自身业务需求选择性参考。`,
    },
    {
      question: `${title} 提到的工具去哪里找？`,
      answer: `本文涉及的工具和资源，跨境工具说（kjgjs.cn）均有收录。访问 kjgjs.cn「工具库」频道，搜索工具名即可查看官网、定价、优惠和详细评测。`,
    },
    {
      question: `跨境工具说还有什么相关文章？`,
      answer: `跨境工具说持续发布跨境电商工具评测、运营技巧、行业资讯。访问 kjgjs.cn「精选文章」（kjgjs.cn/articles）查看全部内容，或订阅同名公众号「跨境工具说」获取每日推送。`,
    },
  ];
}

/** 生成 FAQPage JSON-LD（复用 lib/seo/tool-faq.ts 的 generateFAQJsonLd 模式） */
export function generateArticleFAQJsonLd(faqs: ArticleFAQ[]): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}

/**
 * 提取文章中的数字统计（≥3 个触发"合格"，提示曹总 GEO 数据规范）
 * 用于 admin 编辑页实时统计
 */
export function countNumbers(html: string): number {
  if (!html) return 0;
  const text = htmlToText(html, 50000);
  // 匹配：数字 + 可选单位（亿/万/%/元/月/天/RMB/USD/$/¥）
  const matches = text.match(/\d+(\.\d+)?\s*(亿|万|%|元|月|天|RMB|USD|\$|¥|个|次|条|篇|人|家|种|条|款|家|家平台|折|倍|岁|小时|分钟|秒|位|件|份)/g);
  return matches ? matches.length : 0;
}

/**
 * 提取文章中的引用来源数量（a.citation-ref · v11.46 Tiptap Link 兼容）
 */
export function countCitations(html: string): number {
  if (!html) return 0;
  const matches = html.match(/<a[^>]*class=["'][^"']*citation-ref[^"']*["'][^>]*>/g);
  return matches ? matches.length : 0;
}

/**
 * 提取所有引用来源（a.citation-ref 标签的 data-source-name / data-source-url）
 * 用于文章详情页文末「参考资料」自动聚合
 */
export interface CitationRef {
  id: number; // 引用编号 1, 2, 3
  name: string; // 来源名（如「艾媒咨询 2026 Q1 报告」）
  url: string; // 来源 URL
}
export function extractCitations(html: string): CitationRef[] {
  if (!html) return [];
  const refs: CitationRef[] = [];
  const regex = /<a[^>]*class=["'][^"']*citation-ref[^"']*["'][^>]*data-source-name=["']([^"']+)["'][^>]*data-source-url=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/g;
  let m;
  let i = 1;
  while ((m = regex.exec(html)) !== null) {
    refs.push({ id: i++, name: m[1], url: m[2] });
  }
  return refs;
}
