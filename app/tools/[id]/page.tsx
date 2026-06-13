import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header, Footer } from '@/components/layout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ToolCard } from '@/components/tool-card';
import { ArrowLeft, ExternalLink, Gift, Globe, HelpCircle, Newspaper, Tag, Wrench, BookOpen, Tag as TagIcon } from 'lucide-react';
import { prisma } from '@/lib/db';
import { generateToolFAQs, generateFAQJsonLd } from '@/lib/seo/tool-faq';
import { getRelatedDealsByBrand, getRelatedNewsByCategory, getRelatedArticlesByCategory } from '@/lib/seo/related-content';

const SITE_URL = 'https://kjgjs.cn';
const SITE_NAME = '跨境工具说';

// v11.14 P2-13 性能：tools 详情改 SSG + ISR 3600
// 之前 ISR 3600 + dynamicParams=true：每次访问 Next.js 视为 dynamic（async generateMetadata 查 DB）
// 改 SSG + generateStaticParams：build 时预渲染 70 个 tool 详情页，CDN 真命中
// 新增 tool 走 dynamicParams=true 兜底
export const revalidate = 3600;
export const dynamicParams = true;

/** v11.14 SSG 化：build 时预渲染所有 tool id */
export async function generateStaticParams() {
  const tools = await prisma.tool.findMany({ select: { id: true } });
  return tools.map(t => ({ id: String(t.id) }));
}

interface PageProps {
  params: { id: string };
}

/** generateMetadata: 动态 title/desc/keywords/OG/canonical */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return { title: '工具不存在' };

  const tool = await prisma.tool.findUnique({
    where: { id },
    select: { name: true, business: true, categoryKey: true, discount: true, url: true, logo: true },
  });
  if (!tool) return { title: '工具不存在' };

  const desc = `${tool.name} - ${tool.business}。${tool.discount ? `专属优惠：${tool.discount}。` : ''}跨境工具说精选收录。`;
  const keywords = [tool.name, tool.business, tool.categoryKey, '跨境电商', '亚马逊', 'TikTok', '工具评测'].filter(Boolean).join(',');

  return {
    title: `${tool.name} - ${tool.business}`,
    description: desc,
    keywords,
    alternates: { canonical: `${SITE_URL}/tools/${id}` },
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: `${SITE_URL}/tools/${id}`,
      siteName: SITE_NAME,
      title: `${tool.name} - ${tool.business}`,
      description: desc,
      // images 由 app/tools/[id]/opengraph-image.tsx 动态生成
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.name} - ${tool.business}`,
      description: desc,
      // images 由 opengraph-image.tsx 动态生成
    },
  };
}

export default async function ToolDetailPage({ params }: PageProps) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  const tool = await prisma.tool.findUnique({
    where: { id },
  });
  if (!tool) notFound();

  // 同分类其他工具（排除自己，最多 6 个）
  const relatedTools = await prisma.tool.findMany({
    where: {
      categoryKey: tool.categoryKey,
      id: { not: id },
    },
    orderBy: [{ featured: 'desc' }, { sort: 'asc' }],
    take: 6,
  });

  // v11.12 P1-5 FAQ：生成 4 个常见问题
  const faqs = generateToolFAQs({
    name: tool.name,
    business: tool.business,
    category: tool.categoryKey,
    url: tool.url,
    discount: tool.discount,
  });
  const faqJsonLd = generateFAQJsonLd(faqs);

  // v11.12 P1-6 内链：相关资讯/文章/优惠
  const [relatedNews, relatedArticles, relatedDeals] = await Promise.all([
    getRelatedNewsByCategory(tool.categoryKey),
    getRelatedArticlesByCategory(tool.categoryKey),
    getRelatedDealsByBrand(tool.name, id),
  ]);

  const hasDiscount = !!tool.discount;
  const targetUrl = tool.affiliateUrl || tool.url;
  const hasLogo = !!tool.logo;

  // JSON-LD: SoftwareApplication + BreadcrumbList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: tool.name,
        description: tool.business,
        url: tool.url,
        image: tool.logo || undefined,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: tool.categoryKey,
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          url: tool.affiliateUrl || tool.url,
          priceCurrency: 'CNY',
          price: '0',
          availability: 'https://schema.org/InStock',
          description: tool.discount || undefined,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: '工具导航', item: `${SITE_URL}/tools` },
          { '@type': 'ListItem', position: 3, name: tool.name },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* 面包屑 */}
        <Breadcrumb
          items={[
            { name: '首页', href: '/' },
            { name: '工具导航', href: '/tools' },
            { name: tool.name, href: `/tools/${id}` },
          ]}
        />

        {/* 返回按钮 */}
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition mb-6 mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回工具列表
        </Link>

        {/* JSON-LD: SoftwareApplication + BreadcrumbList */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* JSON-LD: FAQPage（v11.12 P1-5） */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />

        {/* Hero 卡片 */}
        <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* 顶部装饰条 */}
          <div className="h-2 bg-gradient-to-r from-brand-500 via-brand-600 to-accent-500" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Logo */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {hasLogo ? (
                  <Image
                    src={tool.logo!}
                    alt={tool.name}
                    width={128}
                    height={128}
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-4xl md:text-5xl font-bold text-brand-600">
                    {tool.name[0]}
                  </span>
                )}
              </div>

              {/* 标题 + 业务 + 优惠 */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-md text-xs font-medium">
                    <Tag className="w-3 h-3" />
                    {tool.categoryKey}
                  </span>
                  {hasDiscount && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md text-xs font-bold">
                      <Gift className="w-3 h-3" />
                      专属优惠
                    </span>
                  )}
                  {tool.featured && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium">
                      ⭐ 编辑推荐
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-3">
                  {tool.name}
                </h1>

                <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-5">
                  {tool.business}
                </p>

                {/* CTA 按钮组 */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition shadow-md shadow-brand-200"
                  >
                    {hasDiscount ? (
                      <>
                        <Gift className="w-4 h-4" />
                        获取优惠
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        访问官网
                      </>
                    )}
                  </a>
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
                  >
                    <Globe className="w-4 h-4" />
                    官网
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 优惠详情（独立区块） */}
          {hasDiscount && (
            <div className="px-6 sm:px-8 py-5 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-t border-orange-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-orange-900 mb-1">
                    跨境工具说专属优惠
                  </h2>
                  <p className="text-sm text-orange-800 leading-relaxed break-words">
                    {tool.discount}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 工具信息网格 */}
          <div className="px-6 sm:px-8 py-6 bg-slate-50/50 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <Wrench className="w-4 h-4" />
              工具信息
            </h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex items-start gap-2">
                <dt className="text-slate-500 min-w-[64px]">工具名称</dt>
                <dd className="text-slate-900 font-medium flex-1">{tool.name}</dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="text-slate-500 min-w-[64px]">分类</dt>
                <dd className="text-slate-900 font-medium flex-1">{tool.categoryKey}</dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="text-slate-500 min-w-[64px]">业务方向</dt>
                <dd className="text-slate-900 font-medium flex-1">{tool.business}</dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="text-slate-500 min-w-[64px]">官网</dt>
                <dd className="flex-1 min-w-0">
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-brand-600 hover:text-brand-700 break-all"
                  >
                    {tool.url}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </article>

        {/* v11.12 P1-5 FAQ 常见问题 */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-600" />
            常见问题
          </h2>
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
            {faqs.map((f, idx) => (
              <details
                key={idx}
                className="group p-5 hover:bg-slate-50/50 transition [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-start gap-3 cursor-pointer list-none">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    Q
                  </span>
                  <span className="flex-1 font-medium text-slate-900">{f.question}</span>
                  <span className="flex-shrink-0 w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </summary>
                <div className="mt-3 ml-9 text-sm text-slate-600 leading-relaxed">
                  {f.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* 同分类其他工具 */}
        {relatedTools.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-brand-600" />
              同分类其他工具
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedTools.map((t) => (
                <ToolCard
                  key={t.id}
                  tool={{
                    name: t.name,
                    url: t.url,
                    business: t.business,
                    category: t.categoryKey,
                    affiliateUrl: t.affiliateUrl,
                    discount: t.discount,
                    logo: t.logo,
                    featured: t.featured,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* v11.12 P1-6 内链：相关资讯 + 相关文章 + 相关优惠 */}
        {(relatedNews.length > 0 || relatedArticles.length > 0 || relatedDeals.length > 0) && (
          <section className="mt-10 grid lg:grid-cols-3 gap-6">
            {/* 相关资讯 */}
            {relatedNews.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-brand-600" />
                  相关资讯
                </h2>
                <ul className="space-y-2.5">
                  {relatedNews.slice(0, 5).map((n) => (
                    <li key={n.id}>
                      <Link
                        href={`/news/${n.id}`}
                        className="block group p-3 bg-white border border-slate-200 rounded-lg hover:border-brand-300 hover:shadow-sm transition"
                      >
                        <div className="text-sm font-medium text-slate-900 group-hover:text-brand-600 line-clamp-2 leading-snug">
                          {n.title}
                        </div>
                        {n.category && (
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <TagIcon className="w-3 h-3" />
                            {n.category}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 相关文章 */}
            {relatedArticles.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  相关文章
                </h2>
                <ul className="space-y-2.5">
                  {relatedArticles.slice(0, 5).map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/articles/${a.slug}`}
                        className="block group p-3 bg-white border border-slate-200 rounded-lg hover:border-brand-300 hover:shadow-sm transition"
                      >
                        <div className="text-sm font-medium text-slate-900 group-hover:text-brand-600 line-clamp-2 leading-snug">
                          {a.title}
                        </div>
                        {a.category && (
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <TagIcon className="w-3 h-3" />
                            {a.category}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 相关优惠 */}
            {relatedDeals.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-brand-600" />
                  {tool.name} 相关优惠
                </h2>
                <ul className="space-y-2.5">
                  {relatedDeals.slice(0, 4).map((d) => (
                    <li key={d.id}>
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="block group p-3 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg hover:border-orange-400 hover:shadow-sm transition"
                      >
                        <div className="text-sm font-medium text-slate-900 group-hover:text-orange-700 line-clamp-2 leading-snug">
                          {d.title}
                        </div>
                        {d.discount && (
                          <div className="text-xs text-orange-700 mt-1 font-medium">
                            🎁 {d.discount}
                          </div>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
