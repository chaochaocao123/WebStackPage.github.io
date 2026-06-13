import type { Metadata } from 'next';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Building2, Users, Target, Heart, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '2026-06-13';

export const metadata: Metadata = {
  title: '关于我们',
  description: '跨境工具说 - 专注为亚马逊、TikTok、Temu、Shopee 等平台跨境卖家精选工具、分享资讯、整理优惠的导航平台。',
  alternates: { canonical: 'https://kjgjs.cn/about' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://kjgjs.cn/about',
    siteName: '跨境工具说',
    title: '关于我们 - 跨境工具说',
    description: '专注为跨境卖家精选工具、分享资讯、整理优惠的导航平台',
  },
};

// 强制 SSR：保证内容最新
export const revalidate = 3600;

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: '关于跨境工具说',
    url: 'https://kjgjs.cn/about',
    description: '跨境工具说是专注为跨境卖家精选工具、分享资讯、整理优惠的导航平台',
    mainEntity: {
      '@type': 'Organization',
      name: '跨境工具说',
      url: 'https://kjgjs.cn',
      logo: 'https://kjgjs.cn/images/logo/logo.png',
      foundingDate: '2024',
      description: '为亚马逊、TikTok、Temu、Shopee 等平台跨境卖家精选的工具导航、热门资讯、优惠活动',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+86-18971469839',
        contactType: 'customer service',
        availableLanguage: 'Chinese',
      },
      sameAs: [
        'https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=跨境工具说',
        'https://www.xiaohongshu.com/user/profile/跨境工具说',
        'https://www.zhihu.com/org/跨境工具说',
      ],
    },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        <Breadcrumb items={[{ name: '首页', href: '/' }, { name: '关于我们', href: '/about' }]} />

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition mb-6 mt-4">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <article className="prose prose-slate max-w-none">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">关于跨境工具说</h1>
            <p className="text-sm text-slate-500">最后更新：{LAST_UPDATED}</p>
          </header>

          {/* 站点定位 */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-brand-600" />
              <h2 className="text-xl font-bold text-slate-900 m-0">我们的定位</h2>
            </div>
            <div className="bg-gradient-to-br from-brand-50 to-orange-50 border border-brand-200 rounded-xl p-6">
              <p className="text-slate-700 leading-relaxed m-0">
                <strong className="text-brand-700">跨境工具说</strong>（kjgjs.cn）是一个专注于
                <strong className="text-brand-700">跨境电商卖家工具导航</strong>的平台。我们为亚马逊、TikTok、Temu、Shopee、Etsy
                等平台的跨境卖家精选经过实测的工具，分享行业最新资讯，整理限时优惠活动，帮助卖家
                <strong className="text-brand-700">节省选型时间、降低运营成本、提升业务效率</strong>。
              </p>
            </div>
          </section>

          {/* 我们做什么 */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-6 h-6 text-brand-600" />
              <h2 className="text-xl font-bold text-slate-900 m-0">我们提供什么</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-5 bg-white">
                <h3 className="text-base font-semibold text-slate-900 m-0 mb-2">🛠️ 工具导航</h3>
                <p className="text-sm text-slate-600 m-0">
                  收录 70+ 经过筛选的跨境工具，覆盖 ERP 管理、选品调研、关键词优化、超级浏览器、翻译工具、社媒营销、
                  物流跟踪等所有运营环节。每个工具都有详细介绍、官网链接、当前优惠。
                </p>
              </div>
              <div className="border border-slate-200 rounded-xl p-5 bg-white">
                <h3 className="text-base font-semibold text-slate-900 m-0 mb-2">📰 行业资讯</h3>
                <p className="text-sm text-slate-600 m-0">
                  每日更新行业新闻、平台政策、运营技巧。所有资讯均来自官方公告或可信来源，并附上原文链接。
                </p>
              </div>
              <div className="border border-slate-200 rounded-xl p-5 bg-white">
                <h3 className="text-base font-semibold text-slate-900 m-0 mb-2">🎁 优惠活动</h3>
                <p className="text-sm text-slate-600 m-0">
                  整理各大工具厂商的限时优惠、专属折扣码、新人福利。通过我们的链接注册，您可享受比官方更优惠的价格。
                </p>
              </div>
              <div className="border border-slate-200 rounded-xl p-5 bg-white">
                <h3 className="text-base font-semibold text-slate-900 m-0 mb-2">✍️ 深度文章</h3>
                <p className="text-sm text-slate-600 m-0">
                  原创运营干货、工具评测、平台对比、案例拆解。所有内容基于真实使用经验，不做夸大宣传。
                </p>
              </div>
            </div>
          </section>

          {/* 我们的原则 */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-6 h-6 text-brand-600" />
              <h2 className="text-xl font-bold text-slate-900 m-0">我们的原则</h2>
            </div>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-brand-600 font-bold">1.</span>
                <span><strong>真实优先</strong>：所有工具评测基于实际使用，不接受厂商付费好评，差评如实呈现。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 font-bold">2.</span>
                <span><strong>中立客观</strong>：工具排序基于功能、口碑、性价比，不因联盟佣金高低影响推荐顺序。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 font-bold">3.</span>
                <span><strong>持续更新</strong>：定期回访工具厂商，确认功能、价格、优惠信息最新；下架失效或不达标的产品。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 font-bold">4.</span>
                <span><strong>用户至上</strong>：如果您发现工具信息有误或体验问题，欢迎通过页面底部联系方式反馈，我们会在 24 小时内核实并修正。</span>
              </li>
            </ul>
          </section>

          {/* 团队 */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-brand-600" />
              <h2 className="text-xl font-bold text-slate-900 m-0">关于运营团队</h2>
            </div>
            <div className="border border-slate-200 rounded-xl p-6 bg-white">
              <p className="text-slate-700 leading-relaxed m-0">
                跨境工具说由具有 5+ 年跨境电商运营经验的团队运营。团队成员包括前亚马逊运营、TikTok 商家、独立站操盘手，
                深度使用过市面上主流的 50+ 跨境工具。我们的内容不靠 AI 生成，核心评测均来自实际使用经验。
              </p>
              <p className="text-slate-700 leading-relaxed mt-3 m-0">
                我们同时也是公众号「跨境工具说」、小红书「跨境工具说」、知乎「跨境工具说」、抖音「跨境工具说」的运营者，
                累计粉丝 15000+，日更内容。在公众号上，您可以与运营团队直接对话。
              </p>
            </div>
          </section>

          {/* 商务合作 */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">商务合作</h2>
            <div className="border-l-4 border-brand-500 bg-brand-50/50 rounded-r-lg p-4">
              <p className="text-slate-700 m-0">
                工具厂商希望合作推广、卖家希望入驻优惠、媒体希望转载内容，请联系：
              </p>
              <p className="text-slate-900 font-medium mt-2 m-0">
                邮箱：kjgjs <span className="text-slate-400">（请通过页面底部"联系我们"获取邮箱）</span><br />
                电话：<span className="text-brand-700">18971469839</span>
              </p>
            </div>
          </section>

          <div className="border-t border-slate-200 pt-6 mt-8 text-sm text-slate-500">
            <p>本页内容最后更新于 {LAST_UPDATED}，如发现内容过时或错误，请通过 <Link href="/contact" className="text-brand-600 hover:text-brand-700">联系我们</Link> 反馈。</p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
