import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header, Footer } from '@/components/layout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ToolCard } from '@/components/tool-card';
import { ArrowLeft, Calendar, User, Tag, ExternalLink, Wrench } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getRecommendedToolsByCategory } from '@/lib/seo/related-content';

const SITE_URL = 'https://kjgjs.cn';
const SITE_NAME = '跨境工具说';

// v11.14 P2-13 性能：articles 详情改 SSG + ISR 3600
// 之前 force-dynamic：每次访问都查 DB。Article 表 0 条时无所谓，数据来时再优化。
// 改 SSG + generateStaticParams：build 时预渲染所有已存在 article
// 新增 article 走 dynamicParams=true 兜底
export const revalidate = 3600;
export const dynamicParams = true;

/** v11.14 SSG 化：build 时预渲染所有 article slug */
export async function generateStaticParams() {
  const articles = await prisma.article.findMany({ select: { slug: true } });
  return articles.map(a => ({ slug: a.slug }));
}

/** 从 Article.content 提取纯文本（用于 description） */
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

/** SEO: generateMetadata 动态 title/description/OG/Twitter/canonical */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const item = await prisma.article.findUnique({ where: { slug: params.slug } });
  if (!item) return { title: '文章不存在' };

  const desc = item.excerpt || extractText(item.content || '', 160);
  const tags: string[] = (() => {
    try { return JSON.parse(item.tags); } catch { return []; }
  })();

  return {
    title: item.title,
    description: desc,
    keywords: [item.category || '跨境电商', ...tags, '亚马逊', 'TikTok'].filter(Boolean).join(','),
    authors: [{ name: item.author }],
    alternates: { canonical: `${SITE_URL}/articles/${item.slug}` },
    openGraph: {
      type: 'article',
      locale: 'zh_CN',
      url: `${SITE_URL}/articles/${item.slug}`,
      siteName: SITE_NAME,
      title: item.title,
      description: desc,
      // images 由 app/articles/[slug]/opengraph-image.tsx 动态生成（next/og 自动接管）
      publishedTime: new Date(item.publishedAt).toISOString(),
      modifiedTime: new Date(item.updatedAt).toISOString(),
      authors: [item.author],
      section: item.category || '跨境电商',
      tags: tags.length > 0 ? tags : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      description: desc,
      // images 由 opengraph-image.tsx 动态生成
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const item = await prisma.article.findUnique({ where: { slug: params.slug } });
  if (!item) notFound();

  // viewCount 异步 +1（不阻塞渲染）
  prisma.article.update({
    where: { id: item.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  // v11.12 P1-6 内链：推荐工具（按 category 拉 6 个）
  const recommendedTools = await getRecommendedToolsByCategory(item.category || '');

  const tags: string[] = (() => {
    try { return JSON.parse(item.tags); } catch { return []; }
  })();

  const publishedAtStr = new Date(item.publishedAt).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const updatedAtStr = new Date(item.updatedAt).toLocaleString('zh-CN');

  // JSON-LD: Article
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title,
    description: item.excerpt || extractText(item.content || '', 160),
    image: item.cover ? [item.cover] : [`${SITE_URL}/og-image.png`],
    datePublished: new Date(item.publishedAt).toISOString(),
    dateModified: new Date(item.updatedAt).toISOString(),
    author: { '@type': 'Person', name: item.author },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/articles/${item.slug}` },
    articleSection: item.category || '跨境电商',
    keywords: tags.join(','),
    wordCount: item.content?.length || 0,
    inLanguage: 'zh-CN',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* JSON-LD: Article */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />

        {/* 面包屑（视觉 + BreadcrumbList JSON-LD 一体化） */}
        <Breadcrumb
          truncateLast
          items={[
            { name: '首页', href: '/' },
            { name: '精选文章', href: '/articles' },
            { name: item.title },
          ]}
        />

        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回文章列表
        </Link>

        <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-100">
            {item.category && (
              <span className="inline-block px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-xs font-medium mb-3">
                {item.category}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {item.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-4">
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3" />
                {item.author}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {publishedAtStr}
              </span>
              {item.updatedAt && new Date(item.updatedAt).getTime() - new Date(item.publishedAt).getTime() > 86400000 && (
                <span className="inline-flex items-center gap-1 text-orange-600">
                  更新于 {updatedAtStr}
                </span>
              )}
            </div>
            {item.excerpt && (
              <p className="mt-5 text-slate-600 leading-relaxed text-base border-l-4 border-brand-200 pl-4 bg-brand-50/30 py-3">
                {item.excerpt}
              </p>
            )}
          </div>

          {/* 封面图 */}
          {item.cover && (
            <div className="bg-slate-50">
              <img
                src={item.cover}
                alt={item.title}
                className="w-full max-h-[480px] object-contain mx-auto"
                loading="lazy"
              />
            </div>
          )}

          {/* 正文 */}
          <div className="p-6 sm:p-8">
            <div
              className="news-content prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: item.content || '' }}
            />

            {/* 标签 */}
            {tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-slate-400" />
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-sm">
            <Link href="/articles" className="text-slate-500 hover:text-brand-600">
              ← 返回列表
            </Link>
            {item.source && (
              <a
                href={item.source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-brand-600"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                查看原文
              </a>
            )}
          </div>
        </article>

        {/* v11.12 P1-6 推荐工具 */}
        {recommendedTools.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-brand-600" />
              推荐工具
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedTools.map((t) => (
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
      </main>
      <Footer />
    </div>
  );
}
