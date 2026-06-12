import Link from 'next/link';
import type { Metadata } from 'next';
import Image from 'next/image';
import { Header, Footer } from '@/components/layout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ToolCard } from '@/components/tool-card';
import { Search as SearchIcon, Newspaper, Wrench, FileText, Tag, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { searchAll, highlightParts, findSnippet, type SearchTab } from '@/lib/data/search';
import { getNewsFromDB } from '@/lib/data/news';
import { getTools } from '@/lib/data/tools-db';
import { logSearch } from '@/lib/data/search-log';
import { SearchResultsClient } from './_components/SearchResultsClient';

const SITE_URL = 'https://kjgjs.cn';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SearchPageProps {
  searchParams: { q?: string; tab?: string };
}

const VALID_TABS: SearchTab[] = ['all', 'news', 'tools', 'articles', 'deals'];

function normalizeTab(raw: string | undefined): SearchTab {
  if (raw && VALID_TABS.includes(raw as SearchTab)) {
    return raw as SearchTab;
  }
  return 'all';
}

/** 把 HTML 标签去掉（mjzj 抓的 content 是 HTML）— 用于 snippet 抽取 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** SEO: 动态 title + description，**但**当 q 为空时不进搜索引擎索引 */
export function generateMetadata({ searchParams }: SearchPageProps): Metadata {
  const q = (searchParams.q || '').trim();
  if (!q) {
    return {
      title: '搜索',
      description: '搜索跨境工具说 — 工具、文章、资讯、优惠一网打尽',
      alternates: { canonical: `${SITE_URL}/search` },
      robots: { index: false, follow: true },
    };
  }
  const title = `搜索「${q}」的结果`;
  const description = `在跨境工具说搜索「${q}」 — 工具、文章、资讯、优惠全站内容即时检索。`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/search?q=${encodeURIComponent(q)}` },
    robots: { index: false, follow: true }, // 搜索结果页不进索引（避免大量空 query URL 被收录）
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: `${SITE_URL}/search?q=${encodeURIComponent(q)}`,
      siteName: '跨境工具说',
      title: `${title} | 跨境工具说`,
      description,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawQ = searchParams.q || '';
  const tab = normalizeTab(searchParams.tab);
  const results = await searchAll(rawQ);

  // 关键词监控：写入 SearchLog（fire-and-forget 失败不阻塞）
  if (rawQ.trim().length >= 2) {
    await logSearch({
      keyword: rawQ,
      resultCount: results.total,
      tab,
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* 面包屑（视觉 + BreadcrumbList JSON-LD 一体化） */}
        <Breadcrumb
          items={[
            { name: '首页', href: '/' },
            {
              name: rawQ ? `搜索「${rawQ}」` : '搜索结果',
              href: `/search${rawQ ? `?q=${encodeURIComponent(rawQ)}` : ''}`,
            },
          ]}
        />

        {/* 页面头 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <Link href="/" className="hover:text-brand-600">首页</Link>
            <span>/</span>
            <span className="text-slate-700">搜索</span>
            {rawQ && (
              <>
                <span>/</span>
                <span className="text-slate-700 truncate max-w-xs">「{rawQ}」</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <SearchIcon className="w-6 h-6 text-accent-500" />
            <h1 className="text-2xl font-bold text-slate-900">
              {rawQ ? `搜索结果` : '站内搜索'}
            </h1>
          </div>
          {rawQ ? (
            <p className="text-slate-500">
              关键词「<span className="font-semibold text-slate-700">{rawQ}</span>」共找到{' '}
              <span className="font-semibold text-brand-600">{results.total}</span> 条结果
            </p>
          ) : (
            <p className="text-slate-500">搜索工具、文章、资讯、优惠 — 全站一网打尽</p>
          )}
        </div>

        {/* 搜索框（独立可输入，提交跳当前页） */}
        <form
          action="/search"
          method="get"
          className="mb-6 flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus-within:border-brand-400 transition-colors"
        >
          <SearchIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            name="q"
            defaultValue={rawQ}
            placeholder="搜索工具名、文章标题、资讯关键词..."
            className="flex-1 bg-transparent text-sm sm:text-base outline-none placeholder:text-slate-400"
            autoFocus={!rawQ}
          />
          {tab !== 'all' && <input type="hidden" name="tab" value={tab} />}
          <button
            type="submit"
            className="px-4 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            搜索
          </button>
        </form>

        {!rawQ ? (
          <EmptyState />
        ) : results.total === 0 ? (
          <NoResults q={rawQ} />
        ) : (
          <SearchResultsClient
            initialTab={tab}
            initialCounts={results.counts}
            q={rawQ}
            panels={{
              all: <AllResults results={results} />,
              news: <NewsResultList items={results.news} q={rawQ} total={results.counts.news} />,
              tools: <ToolsResultList items={results.tools} q={rawQ} total={results.counts.tools} />,
              articles: <ArticlesResultList items={results.articles} q={rawQ} total={results.counts.articles} />,
              deals: <DealsResultList items={results.deals} q={rawQ} total={results.counts.deals} />,
            }}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

/* ============================================================
 *  4 个分类结果列表
 * ============================================================ */

function AllResults({ results }: { results: Awaited<ReturnType<typeof searchAll>> }) {
  return (
    <div className="space-y-10">
      {results.tools.length > 0 && (
        <section>
          <SectionHeader icon={<Wrench className="w-5 h-5" />} title="工具" count={results.counts.tools} href={`/search?q=${encodeURIComponent(results.q)}&tab=tools`} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.tools.slice(0, 6).map((t) => <ToolCard key={t.name} tool={t} showCategory />)}
          </div>
        </section>
      )}
      {results.news.length > 0 && (
        <section>
          <SectionHeader icon={<Newspaper className="w-5 h-5" />} title="资讯" count={results.counts.news} href={`/search?q=${encodeURIComponent(results.q)}&tab=news`} />
          <NewsResultList items={results.news.slice(0, 6)} q={results.q} total={results.counts.news} compact />
        </section>
      )}
      {results.articles.length > 0 && (
        <section>
          <SectionHeader icon={<FileText className="w-5 h-5" />} title="文章" count={results.counts.articles} href={`/search?q=${encodeURIComponent(results.q)}&tab=articles`} />
          <ArticlesResultList items={results.articles.slice(0, 6)} q={results.q} total={results.counts.articles} compact />
        </section>
      )}
      {results.deals.length > 0 && (
        <section>
          <SectionHeader icon={<Tag className="w-5 h-5" />} title="优惠" count={results.counts.deals} href={`/search?q=${encodeURIComponent(results.q)}&tab=deals`} />
          <DealsResultList items={results.deals.slice(0, 6)} q={results.q} total={results.counts.deals} compact />
        </section>
      )}
    </div>
  );
}

function SectionHeader({ icon, title, count, href }: { icon: React.ReactNode; title: string; count: number; href: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-brand-600">{icon}</span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <span className="text-sm text-slate-500">（{count}）</span>
      </div>
      <Link href={href} className="text-sm text-brand-600 hover:underline flex items-center gap-1">
        查看全部 <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

function NewsResultList({ items, q, total, compact = false }: { items: Awaited<ReturnType<typeof searchAll>>['news']; q: string; total: number; compact?: boolean }) {
  if (items.length === 0) return <EmptyTab type="资讯" q={q} />;
  return (
    <div className={compact ? 'space-y-3' : 'space-y-3'}>
      {items.map((n) => {
        const summary = n.summary || stripHtml(n.title);
        const snippet = findSnippet(summary, q);
        return (
          <Link
            key={n.id}
            href={`/news/${n.id}`}
            className="group block bg-white border border-slate-200 rounded-xl p-5 card-hover"
          >
            <div className="flex items-start gap-4">
              {n.cover && !compact && (
                <div className="w-32 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <Image src={n.cover} alt={n.title} fill sizes="128px" className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  {n.category && (
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded">{n.category}</span>
                  )}
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(n.publishedAt)}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-600 mb-2 line-clamp-2">
                  {highlightParts(n.title, q)}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2">
                  {highlightParts(snippet, q)}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
      {!compact && total > items.length && (
        <p className="text-center text-sm text-slate-500 mt-4">
          显示前 {items.length} 条，共 {total} 条 — 缩小关键词或查看分类 Tab
        </p>
      )}
    </div>
  );
}

function ToolsResultList({ items, q, total }: { items: Awaited<ReturnType<typeof searchAll>>['tools']; q: string; total: number }) {
  if (items.length === 0) return <EmptyTab type="工具" q={q} />;
  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((t) => <ToolCard key={t.name} tool={t} showCategory />)}
      </div>
      {total > items.length && (
        <p className="text-center text-sm text-slate-500 mt-6">
          显示前 {items.length} 条，共 {total} 条
        </p>
      )}
    </div>
  );
}

function ArticlesResultList({ items, q, total, compact = false }: { items: Awaited<ReturnType<typeof searchAll>>['articles']; q: string; total: number; compact?: boolean }) {
  if (items.length === 0) return <EmptyTab type="文章" q={q} />;
  return (
    <div className="space-y-3">
      {items.map((a) => {
        const snippet = findSnippet(a.excerpt || a.content || '', q);
        return (
          <Link
            key={a.id}
            href={`/articles/${a.slug}`}
            className="group block bg-white border border-slate-200 rounded-xl p-5 card-hover"
          >
            <div className="flex items-start gap-4">
              {a.cover && !compact && (
                <div className="w-32 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <Image src={a.cover} alt={a.title} fill sizes="128px" className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded font-medium">文章</span>
                  {a.category && (
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded">{a.category}</span>
                  )}
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(a.publishedAt)}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-600 mb-2 line-clamp-2">
                  {highlightParts(a.title, q)}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2">
                  {highlightParts(snippet, q)}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
      {!compact && total > items.length && (
        <p className="text-center text-sm text-slate-500 mt-4">
          显示前 {items.length} 条，共 {total} 条
        </p>
      )}
    </div>
  );
}

function DealsResultList({ items, q, total, compact = false }: { items: Awaited<ReturnType<typeof searchAll>>['deals']; q: string; total: number; compact?: boolean }) {
  if (items.length === 0) return <EmptyTab type="优惠" q={q} />;
  return (
    <div className="space-y-3">
      {items.map((d) => {
        const snippet = findSnippet(d.description || d.title, q);
        return (
          <a
            key={d.id}
            href={d.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="group block bg-white border border-slate-200 rounded-xl p-5 card-hover"
          >
            <div className="flex items-start gap-4">
              {d.brandLogo && !compact && (
                <div className="w-12 h-12 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center relative">
                  <Image src={d.brandLogo} alt={d.brand} width={32} height={32} className="object-contain" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded font-medium">优惠</span>
                  <span className="font-medium text-slate-700">{d.brand}</span>
                  {d.discount && <span className="text-orange-600 font-medium">{d.discount}</span>}
                </div>
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-600 mb-2 line-clamp-2">
                  {highlightParts(d.title, q)}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2">
                  {highlightParts(snippet, q)}
                </p>
              </div>
            </div>
          </a>
        );
      })}
      {!compact && total > items.length && (
        <p className="text-center text-sm text-slate-500 mt-4">
          显示前 {items.length} 条，共 {total} 条
        </p>
      )}
    </div>
  );
}

function EmptyTab({ type, q }: { type: string; q: string }) {
  return (
    <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
      <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <h3 className="text-base font-semibold text-slate-700 mb-1">没找到「{q}」相关的{type}</h3>
      <p className="text-sm text-slate-500">试试其他关键词，或切换到「全部」Tab 查看其他类型</p>
    </div>
  );
}

/* ============================================================
 *  空状态 / 无结果引导
 * ============================================================ */

function EmptyState() {
  // 推荐入口
  const suggestions = [
    { label: 'ERP管理系统', href: '/tools?cat=ERP' },
    { label: '选品工具', href: '/tools?cat=选品' },
    { label: '关键词工具', href: '/tools?cat=关键词' },
    { label: '物流跟踪', href: '/tools?cat=物流' },
    { label: 'FBA 利润计算', href: '/tools/fba-calculator' },
    { label: '单位换算', href: '/tools/unit-converter' },
    { label: '汇率转换', href: '/tools/exchange-rate' },
  ];
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-brand-50 to-orange-50 border border-brand-100 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">💡 推荐搜索方向</h2>
        <p className="text-sm text-slate-600 mb-4">试试这些热门分类</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-brand-400 hover:text-brand-600 transition-colors"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

async function NoResults({ q }: { q: string }) {
  // 推荐最新 4 个工具 + 4 条资讯
  const [tools, news] = await Promise.all([getTools(), getNewsFromDB(4)]);
  return (
    <div className="space-y-10">
      <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-700 mb-1">
          没找到与「{q}」相关的结果
        </h3>
        <p className="text-sm text-slate-500 mb-4">建议检查关键词拼写，或换个更通用的词试试</p>
        <Link
          href="/search"
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
        >
          清空搜索 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4">🔥 推荐工具</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.slice(0, 4).map((t) => <ToolCard key={t.name} tool={t} showCategory />)}
        </div>
      </section>

      {news.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">📰 最新资讯</h2>
          <div className="space-y-3">
            {news.map((n) => (
              <Link
                key={n.id}
                href={`/news/${n.id}`}
                className="group block bg-white border border-slate-200 rounded-xl p-4 card-hover"
              >
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(n.publishedAt)}</span>
                </div>
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-brand-600 line-clamp-2">
                  {n.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ============================================================
 *  工具函数
 * ============================================================ */

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return '刚刚';
  if (h < 24) return `${h}小时前`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}天前`;
  return d.toLocaleDateString('zh-CN');
}
