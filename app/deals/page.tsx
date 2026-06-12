import Link from 'next/link';
import Image from 'next/image';
import { Header, Footer } from '@/components/layout';
import { Gift, ExternalLink, Clock, Tag, Flame } from 'lucide-react';
import { getDealsFromDB, DealItem } from '@/lib/data/deals';
import { TOOLS } from '@/lib/data/tools';
import type { Metadata } from 'next';

const SITE_URL = 'https://kjgjs.cn';
const PAGE_TITLE = '优惠活动 - 跨境工具说';
const PAGE_DESC = '跨境电商工具最新优惠活动，专属折扣码';

export const metadata: Metadata = {
  title: '优惠活动',
  description: PAGE_DESC,
  alternates: { canonical: `${SITE_URL}/deals` },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: `${SITE_URL}/deals`,
    siteName: '跨境工具说',
    title: PAGE_TITLE,
    description: PAGE_DESC,
  },
};

// 把 Deal 关联到 TOOLS 信息（图标等）
function enrichDeal(deal: DealItem) {
  const tool = TOOLS.find(
    (t) => t.name === deal.brand || t.affiliateUrl === deal.url
  );
  return { ...deal, tool };
}

export default async function DealsPage() {
  const dbDeals = await getDealsFromDB();
  const deals = dbDeals.map(enrichDeal);

  // JSON-LD: ItemList
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '跨境电商工具优惠活动',
    description: PAGE_DESC,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: deals.length,
    itemListElement: deals.slice(0, 20).map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: d.url,
      name: d.title,
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

        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl font-bold text-slate-900">优惠活动</h1>
        </div>
        <p className="text-slate-500 mb-8">跨境卖家工具最新优惠、限时折扣、专属折扣码</p>

        {deals.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
            <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">优惠活动准备中</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              阶段二将自动从工具厂商官网抓取最新优惠活动。当前可在工具列表中查看带「优惠」标签的工具详情。
            </p>
            <div className="mt-6">
              <Link
                href="/#tools"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700"
              >
                查看工具优惠列表 <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {deals.map((deal, i) => (
              <DealCard key={i} deal={deal} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function DealCard({ deal }: { deal: DealItem & { tool?: typeof TOOLS[number] | undefined } }) {
  return (
    <a
      href={deal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white border border-slate-200 rounded-xl p-5 card-hover relative overflow-hidden"
    >
      <div className="absolute top-0 right-0">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
          <Flame className="w-3 h-3" />
          优惠
        </div>
      </div>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 relative">
          {deal.brandLogo ? (
            // 走 next/image 自动 WebP；缺图时显示首字母渐变 fallback
            // 永远不调 Google Favicon（国内慢 + 不可控）
            <Image
              src={deal.brandLogo}
              alt={deal.brand}
              width={40}
              height={40}
              className="object-contain"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-base font-bold">
              {deal.brand[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition">{deal.title}</h3>
          <div className="text-sm text-slate-500 mt-1">{deal.brand}</div>
          {deal.discount && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium">
              <Tag className="w-3 h-3" />
              {deal.discount}
            </div>
          )}
          {deal.endDate && (
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              至 {new Date(deal.endDate).toLocaleDateString('zh-CN')}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
