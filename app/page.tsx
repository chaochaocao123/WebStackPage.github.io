import Link from 'next/link';
import Image from 'next/image';
import { Header, Footer, QrCodeFloat } from '@/components/layout';
import { ToolGrid } from '@/components/tool-grid';
import { ToolCard } from '@/components/tool-card';
import { getTools, getCategories } from '@/lib/data/tools-db';
import { getNewsFromDB } from '@/lib/data/news';
import { getHotArticles } from '@/lib/data/articles';
import { getAdSpotByKey } from '@/lib/data/ad-spots';
import { TrendingUp, FileText, Newspaper, Gift, Wrench, BookOpen, ChevronRight, Sparkles, Zap, MessageCircle, Flame, Eye, Clock } from 'lucide-react';

// 首页 - 工具导航为主
// v5 性能优化：首页 5 分钟 ISR 缓存，工具数据几小时才变，缓存对用户无感但首屏立省 700ms
// admin mutations 已 revalidatePath('/')，后台改完 5 分钟内自动刷新
export const revalidate = 300;
export const dynamicParams = true;
export default async function HomePage() {
  // 从数据库获取数据
  const tools = await getTools();
  const categories = await getCategories();
  // 最新资讯（首页滚动条用，取 8 条）
  const latestNews = (await getNewsFromDB(8)).map(n => ({
    id: n.id,
    title: n.title,
    publishedAt: n.publishedAt,
  }));
  // 热门文章（v11.35 2026-06-15：A 点位用 1 篇首屏感知 + B 点位用 3 篇完整模块）
  const hotArticles = await getHotArticles(3);
  // 首页 Hero 右侧广告位（v11.37 2026-06-15：曹总要接真实广告主，adSpot 存在则显广告，否则降级热门文章）
  const heroAd = await getAdSpotByKey('homepage-hero');
  
  // 取部分推荐工具到 Hero 区
  const featuredTools = tools.filter((t: any) => t.discount).slice(0, 8);
  // 2026-06-15 v11.34: 删首页工具分类 Tab（曹总：与下方"全部工具"分类筛选重复，没意义）

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero 区 */}
        <section className="relative bg-gradient-to-br from-brand-50 via-white to-orange-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* 主标题 */}
              <div className="lg:col-span-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-medium mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  公众号 15000+ 跨境卖家都在用
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-4">
                  跨境卖家必备<br />
                  <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
                    工具导航大全
                  </span>
                </h1>
                <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-6 max-w-2xl">
                  精选 {tools.length}+ 跨境电商常用工具，覆盖 ERP、选品、关键词、物流、AI 作图、TikTok 运营等全流程。
                  点击直达官网或获取专属优惠。
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href="#tools" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition shadow-md shadow-brand-200">
                    <Zap className="w-4 h-4" />
                    浏览全部工具
                  </a>
                  <Link href="/deals" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium hover:border-orange-300 hover:text-orange-600 transition">
                    <Gift className="w-4 h-4" />
                    查看优惠活动
                  </Link>
                </div>
              </div>

              {/* 右侧统计 + Banner 广告位 */}
              <div className="lg:col-span-1 space-y-3">
                {/* 统计卡片 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="text-2xl font-bold text-brand-600">{tools.length}+</div>
                    <div className="text-xs text-slate-500 mt-1">精选工具</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="text-2xl font-bold text-accent-500">
                      {tools.filter((t: any) => t.discount).length}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">限时优惠</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="text-2xl font-bold text-slate-900">{categories.length - 1}</div>
                    <div className="text-xs text-slate-500 mt-1">工具分类</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="text-2xl font-bold text-slate-900">15000+</div>
                    <div className="text-xs text-slate-500 mt-1">公众号粉丝</div>
                  </div>
                </div>
                {/* A 点位：真实广告位（v11.37 2026-06-15：曹总要接广告主）or 降级热门文章（v11.35 兜底） */}
                {heroAd && heroAd.imageUrl ? (
                  /* 真实广告卡 */
                  <a
                    href={heroAd.linkUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="hidden lg:block bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-brand-400 hover:shadow-md transition-all group"
                  >
                    <div className="relative w-full aspect-video bg-slate-100">
                      <Image
                        src={heroAd.imageUrl}
                        alt={heroAd.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 0px, 320px"
                      />
                      {/* 角标：广告 */}
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded">
                        广告
                      </div>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500 line-clamp-1">{heroAd.name}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-brand-600 transition-colors flex-shrink-0" />
                    </div>
                  </a>
                ) : (
                  /* 降级：热门文章侧栏（曹总还没填广告时回退到 v11.35 视觉） */
                  hotArticles[0] && (
                    <Link
                      href={`/articles/${hotArticles[0].slug}`}
                      className="hidden lg:block bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-400 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-1.5 mb-3">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-bold text-slate-900">热门文章</span>
                        <ChevronRight className="w-3 h-3 text-slate-400 ml-auto group-hover:text-brand-600 transition-colors" />
                      </div>
                      {hotArticles[0].cover ? (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-100 mb-3">
                          <Image
                            src={hotArticles[0].cover}
                            alt={hotArticles[0].title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 0px, 320px"
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-video rounded-lg bg-gradient-to-br from-brand-100 to-accent-100 mb-3 flex items-center justify-center">
                          <FileText className="w-10 h-10 text-brand-500" />
                        </div>
                      )}
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors mb-2 min-h-[2.5rem]">
                        {hotArticles[0].title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 min-h-[2rem]">
                        {hotArticles[0].excerpt}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {hotArticles[0].viewCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {relativeTime(hotArticles[0].publishedAt)}
                        </span>
                      </div>
                    </Link>
                  )
                )}
              </div>
            </div>

          </div>
        </section>

        {/* 优化9：自动滚动资讯区域 */}
        <MarqueeNews news={latestNews} />

        {/* 限时优惠工具 */}
        {featuredTools.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">限时优惠工具</h2>
                <span className="text-xs text-slate-400">使用「跨境工具说」专属优惠码</span>
              </div>
              <Link href="/deals" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {featuredTools.map((tool: any) => (
                <ToolCard key={tool.name} tool={tool} showCategory={true} />
              ))}
            </div>
          </section>
        )}

        {/* 热门文章模块（v11.35 2026-06-15：B 点位，限时优惠之后 + 全部工具之前） */}
        {hotArticles.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">热门文章</h2>
                <span className="text-xs text-slate-400">跨境运营干货精选</span>
              </div>
              <Link href="/articles" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hotArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-brand-400 hover:shadow-lg transition-all"
                >
                  <div className="relative w-full aspect-video bg-slate-100">
                    {article.cover ? (
                      <Image
                        src={article.cover}
                        alt={article.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center">
                        <FileText className="w-12 h-12 text-brand-500" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors mb-2 min-h-[3rem]">
                      {article.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3 min-h-[2.5rem]">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.viewCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {relativeTime(article.publishedAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 全部工具 - 分类筛选 */}
        <section id="tools" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">全部工具</h2>
            </div>
            <div className="text-sm text-slate-500">
              收录 <span className="font-semibold text-slate-900">{tools.length}</span> 个
            </div>
          </div>
          <ToolGrid tools={tools} categories={categories} />
        </section>

        {/* 内容入口区 */}
        <section className="bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <h2 className="text-xl font-bold text-slate-900 mb-6">更多内容</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/articles" className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-400 transition">
                <FileText className="w-8 h-8 text-brand-500 mb-3" />
                <div className="font-semibold text-slate-900 group-hover:text-brand-600">精选文章</div>
                <div className="text-xs text-slate-500 mt-1">跨境运营干货</div>
              </Link>
              <Link href="/news" className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-400 transition">
                <Newspaper className="w-8 h-8 text-accent-500 mb-3" />
                <div className="font-semibold text-slate-900 group-hover:text-brand-600">行业资讯</div>
                <div className="text-xs text-slate-500 mt-1">每日更新</div>
              </Link>
              <Link href="/deals" className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-400 transition">
                <Gift className="w-8 h-8 text-orange-500 mb-3" />
                <div className="font-semibold text-slate-900 group-hover:text-brand-600">优惠活动</div>
                <div className="text-xs text-slate-500 mt-1">限时折扣</div>
              </Link>
              <Link href="/tools" className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-400 transition">
                <Wrench className="w-8 h-8 text-slate-700 mb-3" />
                <div className="font-semibold text-slate-900 group-hover:text-brand-600">实用工具</div>
                <div className="text-xs text-slate-500 mt-1">计算器/换算/查物流</div>
              </Link>
            </div>
          </div>
        </section>

        {/* 公众号引导 */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-3">
                <MessageCircle className="w-3.5 h-3.5" />
                公众号同名矩阵
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">关注「跨境工具说」</h3>
              <p className="text-brand-100 leading-relaxed mb-6">
                公众号、小红书、知乎、抖音同步更新。每天获取跨境工具评测、平台政策解读、运营实战技巧。
              </p>
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="px-3 py-1.5 bg-white/10 rounded-lg">公众号 · 跨境工具说</div>
                <div className="px-3 py-1.5 bg-white/10 rounded-lg">小红书 · 跨境工具说</div>
                <div className="px-3 py-1.5 bg-white/10 rounded-lg">知乎 · 跨境工具说</div>
                <div className="px-3 py-1.5 bg-white/10 rounded-lg">抖音 · 跨境工具说</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      {/* 优化3：右下角悬浮二维码按钮 */}
      <QrCodeFloat />
    </div>
  );
}

// 优化9：自动滚动资讯组件 (动态数据，从数据库读取最新资讯)
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return '刚刚';
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}天前`;
  const week = Math.floor(day / 7);
  if (week < 4) return `${week}周前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

function MarqueeNews({ news }: { news: { id: number; title: string; publishedAt: string }[] }) {
  if (!news.length) return null;
  // 复制一份让滚动更顺滑
  const items = [...news, ...news];

  return (
    <section className="py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 overflow-hidden">
          {/* 标签 */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-brand-600 rounded-md">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-medium text-white">跨境快讯</span>
          </div>

          {/* 滚动区域 */}
          <div className="relative flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap">
              {items.map((item, idx) => (
                <span key={`${item.id}-${idx}`} className="inline-flex items-center">
                  <a
                    href={`/news/${item.id}`}
                    className="text-sm text-slate-700 hover:text-brand-600 transition-colors"
                    title={item.title}
                  >
                    {item.title}
                  </a>
                  <span className="mx-3 text-xs text-slate-400 flex-shrink-0">
                    {relativeTime(item.publishedAt)}
                  </span>
                  <span className="mx-3 text-slate-300">|</span>
                </span>
              ))}
            </div>
          </div>

          {/* 更多按钮 */}
          <Link
            href="/news"
            className="flex-shrink-0 text-xs text-slate-500 hover:text-brand-600 transition-colors flex items-center gap-1"
          >
            更多
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
