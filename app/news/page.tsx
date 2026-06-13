import Link from 'next/link';
import Image from 'next/image';
import { Header, Footer } from '@/components/layout';
import { Newspaper, Clock, TrendingUp } from 'lucide-react';
import { getNewsFromDB } from '@/lib/data/news';
import type { Metadata } from 'next';

const SITE_URL = 'https://kjgjs.cn';
const PAGE_TITLE = '行业资讯 - 跨境工具说';
const PAGE_DESC = '每日更新跨境电商行业热门资讯，覆盖亚马逊、TikTok、Temu、Shopee 等平台';

export const metadata: Metadata = {
  title: '行业资讯',
  description: PAGE_DESC,
  alternates: { canonical: `${SITE_URL}/news` },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: `${SITE_URL}/news`,
    siteName: '跨境工具说',
    title: PAGE_TITLE,
    description: PAGE_DESC,
  },
};

// v11.13 P2-13 性能：news 列表 ISR 10 分钟缓存（admin mutations 已 revalidatePath('/news') 实时刷新）
// 之前 force-dynamic：每次访问都查 DB，CDN 不缓存，TTFB ~1.8s
// 改 ISR 600：CDN HIT 后 50ms 出页面，首屏立省 1.7s
export const revalidate = 600;
export const dynamicParams = true;

export default async function NewsPage() {
  const NEWS = await getNewsFromDB(80);

  // JSON-LD: ItemList（搜索引擎富媒体列表展示）
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '跨境电商行业资讯',
    description: PAGE_DESC,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: NEWS.length,
    itemListElement: NEWS.slice(0, 20).map((n, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/news/${n.id}`,
      name: n.title,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* JSON-LD 结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-accent-500" />
            <h1 className="text-2xl font-bold text-slate-900">行业资讯</h1>
          </div>
        </div>
        <p className="text-slate-500 mb-8">每日从权威资讯网站获取最新最热门信息，帮助大家了解前沿动态~</p>

        {NEWS.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
            <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">资讯准备中</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              正在整理最新跨境电商行业动态，敬请期待。
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* 头条 */}
            {NEWS[0] && (
              <Link
                href={`/news/${NEWS[0].id}`}
                className="lg:col-span-2 group block bg-white border border-slate-200 rounded-xl overflow-hidden card-hover"
              >
                {NEWS[0].cover && (
                  <div className="aspect-[2/1] bg-slate-100 overflow-hidden relative">
                    <Image
                      src={NEWS[0].cover}
                      alt={NEWS[0].title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded font-medium">头条</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(NEWS[0].publishedAt)}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition mb-2">
                    {NEWS[0].title}
                  </h2>
                  {NEWS[0].summary && <p className="text-slate-500 text-sm line-clamp-2">{NEWS[0].summary}</p>}
                </div>
              </Link>
            )}

            {/* 列表 */}
            <div className="space-y-3">
              {NEWS.slice(1, 6).map((item, i) => (
                <Link
                  key={i}
                  href={`/news/${item.id}`}
                  className="group block bg-white border border-slate-200 rounded-lg p-4 card-hover"
                >
                  <div className="text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(item.publishedAt)}</span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-900 group-hover:text-brand-600 line-clamp-2">
                    {item.title}
                  </h3>
                </Link>
              ))}
            </div>

            {/* 其余资讯 */}
            {NEWS.length > 6 && (
              <div className="lg:col-span-3 mt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> 更多资讯
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {NEWS.slice(6).map((item, i) => (
                    <Link
                      key={i}
                      href={`/news/${item.id}`}
                      className="group block bg-white border border-slate-200 rounded-lg p-4 card-hover"
                    >
                      <div className="text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(item.publishedAt)}</span>
                      </div>
                      <h4 className="text-sm font-medium text-slate-900 group-hover:text-brand-600 line-clamp-2">
                        {item.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

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
