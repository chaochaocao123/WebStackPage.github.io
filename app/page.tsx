import Link from 'next/link';
import { Header, Footer, QrCodeFloat } from '@/components/layout';
import { ToolGrid } from '@/components/tool-grid';
import { ToolCard } from '@/components/tool-card';
import { getTools, getCategories } from '@/lib/data/tools-db';
import { TrendingUp, FileText, Newspaper, Gift, Wrench, BookOpen, ChevronRight, Sparkles, Zap, MessageCircle } from 'lucide-react';

// 首页 - 工具导航为主
// v5 性能优化：首页 5 分钟 ISR 缓存，工具数据几小时才变，缓存对用户无感但首屏立省 700ms
// admin mutations 已 revalidatePath('/')，后台改完 5 分钟内自动刷新
export const revalidate = 300;
export const dynamicParams = true;
export default async function HomePage() {
  // 从数据库获取数据
  const tools = await getTools();
  const categories = await getCategories();
  
  // 取部分推荐工具到 Hero 区
  const featuredTools = tools.filter((t: any) => t.discount).slice(0, 8);
  // 头条分类（首页首屏展示）
  const topCategories = categories.filter((c: any) => c.key !== 'all').slice(0, 8);

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
                {/* 广告位 - 等待广告主 */}
                <div className="hidden lg:block bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                  <div className="text-xs text-slate-500 mb-1">AD</div>
                  <div className="text-sm text-slate-600">首页广告位</div>
                  <div className="text-xs text-slate-400 mt-1">PC 端 Banner · 商务合作</div>
                </div>
              </div>
            </div>

            {/* 快捷分类入口 */}
            <div className="mt-8 flex flex-wrap gap-2">
              {topCategories.map((cat: any) => (
                <a
                  key={cat.key}
                  href={`#cat-${cat.key}`}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-brand-400 hover:text-brand-600 transition"
                >
                  {cat.label} <span className="text-xs text-slate-400">({cat.count})</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* 优化9：自动滚动资讯区域 */}
        <MarqueeNews />

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

// 优化9：自动滚动资讯组件 (Mock数据)
function MarqueeNews() {
  // TODO: 等资讯抓取功能上线后替换为真实数据
  const mockNews = [
    { id: 1, title: '亚马逊将于2026年7月27日起实施产品标题新规', time: '28分钟前' },
    { id: 2, title: '我国质量认证国际互认取得显著进展', time: '27分钟前' },
    { id: 3, title: '谷歌Gemini推出小企业新功能，可连接Google服务', time: '17分钟前' },
    { id: 4, title: 'Temu半托管模式再升级，物流时效要求调整', time: '2小时前' },
    { id: 5, title: '亚马逊FBA费用变更通知，多类目仓储费上涨', time: '3小时前' },
    { id: 6, title: 'TikTok Shop美国市场Q2GMV同比增长156%', time: '5小时前' },
    { id: 7, title: '2026年跨境电商行业趋势报告发布', time: '昨天' },
    { id: 8, title: 'Shopee更新卖家保护政策，退货率阈值调整', time: '昨天' },
  ];

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
              {[...mockNews, ...mockNews].map((item, idx) => (
                <span key={`${item.id}-${idx}`} className="inline-flex items-center">
                  <a
                    href="/news"
                    className="text-sm text-slate-700 hover:text-brand-600 transition-colors"
                  >
                    {item.title}
                  </a>
                  <span className="mx-4 text-slate-300">|</span>
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
