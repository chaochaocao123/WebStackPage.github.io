import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header, Footer } from '@/components/layout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ArrowLeft, Clock, ExternalLink, FileText } from 'lucide-react';
import { prisma } from '@/lib/db';

const SITE_URL = 'https://kjgjs.cn';
const SITE_NAME = '跨境工具说';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SOURCE_LABEL: Record<string, string> = {
  manual: '跨境工具说',
  mjzj: '卖家之家',
  cifnews: '雨果网',
};

/** 从 HTML content 提取纯文本前 N 字（用于 description / OG） */
function extractText(html: string, maxLen = 160): string {
  if (!html) return '';
  const text = html
    .replace(/<[^>]+>/g, ' ')   // 去标签
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

/** SEO: generateMetadata 动态注入 title/description/OG/Twitter/canonical */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const id = parseInt(params.id);
  if (isNaN(id)) return { title: '资讯不存在' };

  const item = await prisma.news.findUnique({ where: { id } });
  if (!item) return { title: '资讯不存在' };

  const sourceLabel = SOURCE_LABEL[item.source] || item.source;
  // 优先用 summary，其次用 content 抽前 160 字
  const desc = (item.summary && item.summary.trim()) || extractText(item.content || '', 160);

  return {
    title: item.title,
    description: desc,
    keywords: [sourceLabel, '跨境电商', '亚马逊', 'TikTok', '资讯'].join(','),
    alternates: {
      canonical: `${SITE_URL}/news/${item.id}`,
    },
    openGraph: {
      type: 'article',
      locale: 'zh_CN',
      url: `${SITE_URL}/news/${item.id}`,
      siteName: SITE_NAME,
      title: item.title,
      description: desc,
      // images 由 app/news/[id]/opengraph-image.tsx 动态生成（next/og 自动接管）
      publishedTime: new Date(item.publishedAt).toISOString(),
      modifiedTime: new Date(item.updatedAt).toISOString(),
      authors: [SITE_NAME],
      tags: [sourceLabel],
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      description: desc,
      // images 由 opengraph-image.tsx 动态生成
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const item = await prisma.news.findUnique({ where: { id } });
  if (!item) notFound();

  const sourceLabel = SOURCE_LABEL[item.source] || item.source;
  const publishedAtStr = new Date(item.publishedAt).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // JSON-LD: NewsArticle
  const newsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: item.title,
    description: (item.summary && item.summary.trim()) || extractText(item.content || '', 160),
    image: item.cover ? [item.cover] : [`${SITE_URL}/og-image.png`],
    datePublished: new Date(item.publishedAt).toISOString(),
    dateModified: new Date(item.updatedAt).toISOString(),
    author: { '@type': 'Organization', name: sourceLabel },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/news/${item.id}` },
    articleSection: '跨境电商',
    inLanguage: 'zh-CN',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* JSON-LD: NewsArticle */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
        />

        {/* 面包屑（视觉 + BreadcrumbList JSON-LD 一体化） */}
        <Breadcrumb
          truncateLast
          items={[
            { name: '首页', href: '/' },
            { name: '行业资讯', href: '/news' },
            { name: item.title },
          ]}
        />

        {/* 返回按钮 */}
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回资讯列表
        </Link>

        {/* 标题区 */}
        <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                {sourceLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {publishedAtStr}
              </span>
              {item.sourceType === 'crawl' && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                  自动抓取
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {item.title}
            </h1>
            {item.summary && (
              <p className="mt-4 text-slate-600 leading-relaxed text-base">
                {item.summary}
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
            {item.content ? (
              <div
                className="news-content prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            ) : (
              <div className="text-center py-10 text-slate-500">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm">正文正在抓取中…</p>
                <p className="text-xs text-slate-400 mt-1">
                  下次自动抓取（每天 9:00 / 18:00）后即可阅读
                </p>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 text-sm text-brand-600 hover:text-brand-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    暂时查看原文
                  </a>
                )}
              </div>
            )}
          </div>

          {/* 底部操作区 */}
          <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-sm">
            <Link href="/news" className="text-slate-500 hover:text-brand-600">
              ← 返回列表
            </Link>
            {item.url && (
              <a
                href={item.url}
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
      </main>
      <Footer />
    </div>
  );
}
