// v11.11 P1-5 FAQ Schema：Tool 详情页 FAQ 区块 + JSON-LD FAQPage
// 模板化生成 4 个常见问题（Google Rich Result 友好）
// 每个 Tool 都自动有 FAQ，避免 70 个工具手写

export interface ToolFAQ {
  question: string;
  answer: string;
}

export interface ToolFAQInput {
  name: string;
  business: string;
  category: string;
  url: string;
  discount: string;
  description?: string | null;
}

/** 生成模板化 FAQ（4 个常见问题） */
export function generateToolFAQs(tool: ToolFAQInput): ToolFAQ[] {
  const { name, business, category, url, discount } = tool;

  return [
    {
      question: `${name} 是什么工具？`,
      answer: `${name} 是 ${business}，属于「${category}」分类的跨境电商工具。${
        tool.description ? tool.description + '。' : ''
      }跨境工具说已收录 ${name} 详情、官网地址、优惠信息。`,
    },
    {
      question: `${name} 怎么收费？有什么套餐？`,
      answer: `${name} 的具体定价因套餐和服务时长而异，访问 ${name} 官网 ${url} 查看最新套餐和价格。建议先注册免费试用（若有），再根据业务规模选择合适的订阅计划。`,
    },
    {
      question: discount
        ? `${name} 现在有什么优惠？`
        : `${name} 有优惠吗？怎么省钱？`,
      answer: discount
        ? `当前 ${name} 优惠：${discount}。建议通过跨境工具说专属链接进入，优惠权益更有保障。优惠有时效，下单前请确认仍在有效期内。`
        : `${name} 当前没有公开的限时优惠活动。建议关注 ${name} 官网公告或跨境工具说「优惠活动」频道（kjgjs.cn/deals）获取最新优惠信息。`,
    },
    {
      question: `${name} 适合哪些跨境卖家？`,
      answer: `${name} 适合需要「${business}」的亚马逊、TikTok、Temu、Shopee、Etsy 等平台跨境卖家。无论是新手卖家还是成熟运营团队，都可以根据自己的业务规模和需求选择 ${name} 的对应服务。`,
    },
  ];
}

/** 生成 FAQPage JSON-LD 结构化数据 */
export function generateFAQJsonLd(faqs: ToolFAQ[]): any {
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
