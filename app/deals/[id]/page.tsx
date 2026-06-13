import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header, Footer } from '@/components/layout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ArrowLeft, ExternalLink, Gift, Tag, Calendar, Flame, AlertCircle } from 'lucide-react';
import { prisma } from '@/lib/db';

const SITE_URL = 'https://kjgjs.cn';
const SITE_NAME = '跨境工具说';

// ISR 1 小时：与 Tool/News 详情页一致
export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: { id: string };
}

/** 提取 description 纯文本前 N 字（用于 meta description） */
function extractText(html: string, maxLen = 160): string {
  if (!html) return '';
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/[，。！？、：；]?\s*$/, '') + '…';
}

/** 计算优惠状态 */
function getDealStatus(endDate: Date | null | undefined): {
  expired: boolean;
  limitedTime: boolean;
  daysLeft: number | null;
} {
  if (!endDate) return { expired: false, limitedTime: false, daysLeft: null };
  const now = Date.now();
  const end = new Date(endDate).getTime();
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return {
    expired: daysLeft < 0,
    limitedTime: daysLeft >= 0 && daysLeft <= 7,
    daysLeft,
  };
}

/** generateMetadata: 动态 title/desc/keywords/OG/canonical */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return { title: '优惠活动不存在' };

  const deal = await prisma.deal.findUnique({
    where: { id },
  });
  if (!deal) return { title: '优惠活动不存在' };

  const status = getDealStatus(deal.endDate);
  const desc = deal.description
    ? extractText(deal.description, 160)
    : `${deal.brand} - ${deal.discount || '限时优惠'}。跨境工具说精选收录。`;
  const keywords = [deal.brand, deal.category || '跨境电商', '亚马逊', 'TikTok', '优惠活动', '折扣码'].filter(Boolean).join(',');

  // 过期 deal → noindex 避免软 404 拖累权重
  const robots = status.expired
    ? { index: false, follow: false, googleBot: { index: false, follow: false } }
    : undefined;

  return {
    // 让 metadata.template "%s | 跨境工具说" 自动拼后缀，不要再手动写 | 跨境工具说
    // 避免双拼（v11.10.1 教训）
    title: `${deal.brand} - ${deal.title}`,
    description: desc,
    keywords,
    alternates: { canonical: `${SITE_URL}/deals/${id}` },
    robots,
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: `${SITE_URL}/deals/${id}`,
      siteName: SITE_NAME,
      title: `${deal.brand} - ${deal.title}`,
      description: desc,
      // images 由 app/deals/[id]/opengraph-image.tsx 动态生成
    },
    twitter: {
      card: 'summary_large_image',
      title: `${deal.brand} - ${deal.title}`,
      description: desc,
      // images 由 opengraph-image.tsx 动态生成
    },
  };
}

export default async function DealDetailPage({ params }: PageProps) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  const deal = await prisma.deal.findUnique({
    where: { id },
  });
  if (!deal) notFound();

  const status = getDealStatus(deal.endDate);
  const hasLogo = !!deal.brandLogo;
  const hasDiscount = !!deal.discount;
  const hasCategory = !!deal.category;

  // 同品牌其他 deal（排除自己，最多 4 个）
  const relatedDeals = await prisma.deal.findMany({
    where: {
      brand: deal.brand,
      id: { not: id },
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });

  // JSON-LD: Offer
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Offer',
        name: deal.title,
        description: deal.description || deal.title,
        url: deal.url,
        image: deal.brandLogo || undefined,
        brand: {
          '@type': 'Brand',
          name: deal.brand,
        },
        category: deal.category || undefined,
        priceCurrency: 'CNY',
        price: '0',
        availability: status.expired
          ? 'https://schema.org/Discontinued'
          : 'https://schema.org/InStock',
        validFrom: deal.startDate ? new Date(deal.startDate).toISOString() : undefined,
        validThrough: deal.endDate ? new Date(deal.endDate).toISOString() : undefined,
        seller: {
          '@type': 'Organization',
          name: deal.brand,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: '优惠活动', item: `${SITE_URL}/deals` },
          { '@type': 'ListItem', position: 3, name: deal.title },
        ],
      },
    ],
  };

  const formatDate = (iso: string | Date | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* 面包屑 */}
        <Breadcrumb
          items={[
            { name: '首页', href: '/' },
            { name: '优惠活动', href: '/deals' },
            { name: deal.title, href: `/deals/${id}` },
          ]}
        />

        {/* 返回按钮 */}
        <Link
          href="/deals"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition mb-6 mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回优惠列表
        </Link>

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Hero 卡片 */}
        <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* 顶部装饰条 */}
          <div className="h-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Brand Logo */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {hasLogo ? (
                  <Image
                    src={deal.brandLogo!}
                    alt={deal.brand}
                    width={128}
                    height={128}
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-3xl md:text-4xl font-bold">
                    {deal.brand[0]}
                  </div>
                )}
              </div>

              {/* 标题 + Brand + 优惠 + 状态徽章 */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {status.expired ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                      <AlertCircle className="w-3 h-3" />
                      活动已结束
                    </span>
                  ) : status.limitedTime ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-md text-xs font-bold">
                      <Flame className="w-3 h-3" />
                      限时优惠 · 剩 {status.daysLeft} 天
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md text-xs font-bold">
                      <Gift className="w-3 h-3" />
                      优惠活动
                    </span>
                  )}
                  {hasCategory && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-md text-xs font-medium">
                      <Tag className="w-3 h-3" />
                      {deal.category}
                    </span>
                  )}
                </div>

                <div className="text-sm text-slate-500 mb-1">{deal.brand}</div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-3">
                  {deal.title}
                </h1>

                {hasDiscount && (
                  <div className="text-lg md:text-xl font-bold text-orange-600 mb-5">
                    {deal.discount}
                  </div>
                )}

                {/* CTA 按钮组 */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={deal.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition shadow-md ${
                      status.expired
                        ? 'bg-slate-400 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-orange-200'
                    }`}
                  >
                    {status.expired ? (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        活动已结束
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4" />
                        立即领取优惠
                      </>
                    )}
                  </a>
                  <a
                    href={deal.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    访问活动页
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 优惠详情（独立区块） */}
          {deal.description && (
            <div className="px-6 sm:px-8 py-6 border-t border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <Gift className="w-4 h-4" />
                活动详情
              </h2>
              <div
                className="text-slate-700 text-sm leading-relaxed whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: deal.description }}
              />
            </div>
          )}

          {/* 活动信息网格 */}
          <div className="px-6 sm:px-8 py-6 bg-slate-50/50 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              活动信息
            </h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex items-start gap-2">
                <dt className="text-slate-500 min-w-[64px]">品牌</dt>
                <dd className="text-slate-900 font-medium flex-1">{deal.brand}</dd>
              </div>
              {hasCategory && (
                <div className="flex items-start gap-2">
                  <dt className="text-slate-500 min-w-[64px]">分类</dt>
                  <dd className="text-slate-900 font-medium flex-1">{deal.category}</dd>
                </div>
              )}
              {deal.startDate && (
                <div className="flex items-start gap-2">
                  <dt className="text-slate-500 min-w-[64px]">开始</dt>
                  <dd className="text-slate-900 font-medium flex-1">{formatDate(deal.startDate)}</dd>
                </div>
              )}
              {deal.endDate && (
                <div className="flex items-start gap-2">
                  <dt className="text-slate-500 min-w-[64px]">结束</dt>
                  <dd
                    className={`font-medium flex-1 ${
                      status.expired
                        ? 'text-slate-400 line-through'
                        : status.limitedTime
                        ? 'text-red-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {formatDate(deal.endDate)}
                  </dd>
                </div>
              )}
              <div className="flex items-start gap-2 sm:col-span-2">
                <dt className="text-slate-500 min-w-[64px]">活动链接</dt>
                <dd className="flex-1 min-w-0">
                  <a
                    href={deal.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-brand-600 hover:text-brand-700 break-all"
                  >
                    {deal.url}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </article>

        {/* 同品牌其他优惠 */}
        {relatedDeals.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-orange-500" />
              {deal.brand} 的其他优惠
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {relatedDeals.map((d) => (
                <Link
                  key={d.id}
                  href={`/deals/${d.id}`}
                  className="group block bg-white border border-slate-200 rounded-xl p-4 card-hover"
                >
                  <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition mb-1 line-clamp-2">
                    {d.title}
                  </h3>
                  {d.discount && (
                    <div className="text-sm text-orange-600 font-medium mb-1">{d.discount}</div>
                  )}
                  {d.endDate && (
                    <div className="text-xs text-slate-400">至 {formatDate(d.endDate)}</div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
